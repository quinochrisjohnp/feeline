import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import prepare_models as build


class ModelBuildTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.data = b"model fixture" * 200
        self.expected = {"sha256": hashlib.sha256(self.data).hexdigest(), "size": len(self.data)}
        (self.root / "model_manifest.json").write_text(json.dumps({"weights.pt": self.expected}))
        threshold = self.root / "classification_runs/cat_validator_yolo26s/untouched_test_evaluation/selected_threshold.json"
        threshold.parent.mkdir(parents=True)
        threshold.write_text('{"threshold": 0.56}')
        self.file = self.root / "weights.pt"
        self.pointer = (f'version https://git-lfs.github.com/spec/v1\noid sha256:{self.expected["sha256"]}\nsize {len(self.data)}\n').encode()
        self.file.write_bytes(self.pointer)
        self.calls = []

    def opener(self, request, timeout):
        self.calls.append(request)
        if request.full_url == build.BATCH_URL:
            obj = {"oid": self.expected["sha256"], "size": len(self.data),
                   "actions": {"download": {"href": "https://test.invalid/model"}}}
            return io.BytesIO(json.dumps({"objects": [obj]}).encode())
        return io.BytesIO(self.data)

    def test_pointer_downloads_exact_object_and_verifies(self):
        build.prepare(self.root, self.opener)
        self.assertEqual(self.file.read_bytes(), self.data)
        payload = json.loads(self.calls[0].data)
        self.assertEqual(payload["objects"], [{"oid": self.expected["sha256"], "size": len(self.data)}])
        self.assertNotIn("ref", payload)
        self.assertEqual(len(self.calls), 2)

    def test_existing_binary_never_downloads(self):
        self.file.write_bytes(self.data)
        build.prepare(self.root, self.opener)
        self.assertEqual(self.calls, [])

    def test_corrupt_download_preserves_pointer(self):
        def opener(request, timeout):
            return self.opener(request, timeout) if request.full_url == build.BATCH_URL else io.BytesIO(b'x' * len(self.data))
        with self.assertRaisesRegex(ValueError, "SHA256"):
            build.prepare(self.root, opener)
        self.assertEqual(self.file.read_bytes(), self.pointer)

    def test_wrong_pointer_missing_and_corrupt_binary_fail_closed(self):
        for content in [b'not a model', self.pointer.replace(b'size ', b'size 9'), b'x' * len(self.data)]:
            self.file.write_bytes(content)
            with self.assertRaises(ValueError):
                build.prepare(self.root, self.opener)
        self.file.unlink()
        with self.assertRaises(FileNotFoundError):
            build.prepare(self.root, self.opener)
        self.assertEqual(self.calls, [])

    def test_lfs_error_does_not_replace_pointer(self):
        def opener(request, timeout):
            return io.BytesIO(json.dumps({"objects": [{"oid": self.expected['sha256'], "size": len(self.data), "error": {"code": 404}}]}).encode())
        with self.assertRaisesRegex(ValueError, "unavailable"):
            build.prepare(self.root, opener)
        self.assertEqual(self.file.read_bytes(), self.pointer)

    def test_repository_manifest_matches_local_models(self):
        manifest = json.loads((build.ROOT / 'model_manifest.json').read_text())
        for relative, expected in manifest.items():
            build.verify(build.ROOT / relative, expected)


if __name__ == '__main__':
    unittest.main()
