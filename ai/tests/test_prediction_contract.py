"""Local-only tests. Optional real fixture paths are CLI arguments, never service URLs."""
import asyncio
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import numpy as np
import torch
from PIL import Image
import predict_cat_emotion as pipeline
from fastapi.testclient import TestClient
import ai_api


class ContractTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.image = Path(self.directory.name) / "photo.png"
        Image.new("RGB", (100, 100), "gray").save(self.image)
        self.engine = object.__new__(pipeline.CatEmotionPipeline)
        self.engine.device = torch.device("cpu")
        self.engine.detector_device = "cpu"
        self.engine.detector_conf = 0.20
        self.engine.cat_count_conf = 0.35
        self.engine.cat_threshold = 0.56
        self.engine.min_emotion_confidence = 0
        self.engine.validator = object()
        self.engine.classifier = object()

    def tearDown(self):
        self.directory.cleanup()

    def infer(self, boxes, probability=0.99):
        result = SimpleNamespace(names={0: "cat_face", 1: "cat_full_body"}, boxes=SimpleNamespace(
            cls=torch.tensor([b[0] for b in boxes]), conf=torch.tensor([b[1] for b in boxes]),
            xyxy=torch.tensor([b[2] for b in boxes])))
        self.engine.detector = SimpleNamespace(predict=lambda **kwargs: [result])
        with patch.object(pipeline, "validate_cat_image", return_value={"cat": probability, "non_cat": 1-probability}), patch.object(
            pipeline, "classify", return_value=(np.array([0.1,0.1,0.7,0.1]),2,np.array([0.5]*4))):
            return self.engine.predict(self.image)

    def test_semantic_outcomes_and_no_debug_artifacts(self):
        one = [(0,0.9,[10,10,30,30]),(1,0.9,[0,0,45,95])]
        two = one + [(0,0.9,[60,10,80,30]),(1,0.9,[50,0,95,95])]
        for boxes, probability, status, count in [(one,0.99,"success",1),(one,0.1,"rejected_non_cat",0),
                (two,0.99,"rejected_multiple_cats",2),([(1,0.9,[0,0,90,95])],0.99,"cannot_predict",1)]:
            result = self.infer(boxes,probability)
            self.assertEqual(result["status"],status)
            self.assertEqual(result["cat_count"],count)
            self.assertEqual(set(result),{"status","validation","cat_count","rejection","prediction"})
            if status != "success": self.assertIsNone(result["prediction"]["emotion"])
        self.engine.min_emotion_confidence = 0.8
        self.assertEqual(self.infer(one)["status"],"low_confidence")
        self.assertEqual(list(Path(self.directory.name).iterdir()),[self.image])

    def test_face_only_fallback_and_deduplication(self):
        result=self.infer([(0,0.9,[10,10,30,30]),(0,0.8,[10,10,30,30])])
        self.assertEqual(result["cat_count"],1)
        self.assertEqual(result["prediction"]["route"],"face_only_fallback")

    def test_models_load_once_and_cpu_is_automatic(self):
        with patch.object(pipeline.torch.cuda,"is_available",return_value=False), patch.object(pipeline,"YOLO") as yolo, patch.object(pipeline.torch.jit,"load") as fusion:
            engine=pipeline.CatEmotionPipeline(ROOT)
            self.assertEqual(yolo.call_count,2)
            self.assertEqual(fusion.call_count,1)
            self.assertEqual(engine.device.type,"cpu")
            self.assertEqual((engine.cat_threshold,engine.detector_conf,engine.cat_count_conf),(0.56,0.20,0.35))

    def test_api_startup_worker_and_handled_outcomes(self):
        main_thread=threading.get_ident()
        result=self.infer([],0.1)
        calls=[]
        class FakePipeline:
            def predict(_self,image):
                calls.append((threading.get_ident(),image))
                return result
        with patch.object(ai_api,"CatEmotionPipeline",return_value=FakePipeline()) as constructor:
            with TestClient(ai_api.app) as client:
                for _ in range(2):
                    response=client.post('/predict',files={'file':('photo.png',self.image.read_bytes(),'image/png')})
                    self.assertEqual(response.status_code,200)
                    self.assertEqual(response.json()['status'],'rejected_non_cat')
                self.assertEqual(constructor.call_count,1)
                self.assertEqual(client.post('/predict',files={'file':('bad.txt',b'bad','text/plain')}).status_code,415)
        self.assertTrue(all(thread != main_thread and not image.exists() for thread,image in calls))

    def test_api_failures_hide_private_paths(self):
        engine=SimpleNamespace(predict=lambda _: (_ for _ in ()).throw(RuntimeError('C:/private/model.pt')))
        with patch.object(ai_api,'CatEmotionPipeline',return_value=engine), TestClient(ai_api.app) as client:
            response=client.post('/predict',files={'file':('photo.png',self.image.read_bytes(),'image/png')})
            self.assertEqual(response.status_code,503)
            self.assertNotIn('private',response.text)

    def test_thread_limiter_serializes_without_blocking_event_loop(self):
        active=0
        maximum=0
        class FakePipeline:
            def predict(_self,image):
                nonlocal active,maximum
                active+=1;maximum=max(maximum,active);time.sleep(0.03);active-=1
                return {"status":"cannot_predict"}
        async def exercise():
            from starlette.datastructures import UploadFile, Headers
            from io import BytesIO
            with patch.object(ai_api,'CatEmotionPipeline',return_value=FakePipeline()):
                async with ai_api.lifespan(ai_api.app):
                    request=SimpleNamespace(app=ai_api.app)
                    files=[UploadFile(BytesIO(self.image.read_bytes()),filename='photo.png',headers=Headers({'content-type':'image/png'})) for _ in range(3)]
                    tick=asyncio.create_task(asyncio.sleep(0.005))
                    work=[asyncio.create_task(ai_api.predict(request,f)) for f in files]
                    await tick
                    self.assertTrue(any(not task.done() for task in work))
                    await asyncio.gather(*work)
        asyncio.run(exercise())
        self.assertEqual(maximum,1)


def real_checks(paths):
    engine=pipeline.CatEmotionPipeline(ROOT,cpu=True)
    identities=(id(engine.validator),id(engine.detector),id(engine.classifier))
    for filename in paths:
        result=engine.predict(Path(filename))
        with patch.object(ai_api,'CatEmotionPipeline',return_value=engine), TestClient(ai_api.app) as client:
            image=Path(filename)
            response=client.post('/predict',files={'file':(image.name,image.read_bytes(),'image/png' if image.suffix=='.png' else 'image/jpeg')})
            assert response.status_code==200
            assert response.json()==result

        print('REAL FIXTURE:',Path(filename).name,result['status'],result['cat_count'],result['prediction']['emotion'],flush=True)
        assert identities==(id(engine.validator),id(engine.detector),id(engine.classifier))
        assert set(result)=={'status','validation','cat_count','rejection','prediction'}
    # Compare immutable preprocessing/counting helper code against the tested source.
    source=Path.home()/'Documents/FeELINE_AI/predict_cat_emotion.py'
    if source.is_file():
        import ast
        original=ast.parse(source.read_text(encoding='utf-8'))
        copied=ast.parse((ROOT/'predict_cat_emotion.py').read_text(encoding='utf-8'))
        old={n.name:ast.dump(n,include_attributes=False) for n in original.body if isinstance(n,ast.FunctionDef) and n.name!='main'}
        new={n.name:ast.dump(n,include_attributes=False) for n in copied.body if isinstance(n,ast.FunctionDef)}
        assert all(new[name]==body for name,body in old.items()),'Inference helpers changed'
        print('All original preprocessing/counting/fusion helper ASTs match.',flush=True)
        # Run the unchanged original CLI with temporary outputs as a parity baseline.
        import contextlib, io
        spec=importlib.util.spec_from_file_location('original_feeline_pipeline',source)
        original_module=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(original_module)
        for filename in paths[:3]:
            with tempfile.TemporaryDirectory() as output:
                args=['predict_cat_emotion.py',str(Path(filename).resolve()),'--project-root',str(source.parent),'--cpu','--output-root',output]
                with patch.object(sys,'argv',args), contextlib.redirect_stdout(io.StringIO()): original_module.main()
                baseline=json.loads(next(Path(output).glob('*/prediction.json')).read_text(encoding='utf-8'))
                current=engine.predict(Path(filename))
                for key in ['status','cat_count','validation']: assert baseline[key]==current[key] if key!='validation' else all(baseline[key][k]==v for k,v in current[key].items())
                for key in ['emotion','confidence','probabilities','route']: assert baseline['prediction'][key]==current['prediction'][key]
                print('Original CLI parity:',Path(filename).name,'PASS',flush=True)



if __name__=='__main__':
    paths=sys.argv[1:]
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(ContractTests)
    if not unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful(): sys.exit(1)
    if paths: real_checks(paths)
