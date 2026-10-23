import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from '../../node_modules/typescript/lib/typescript.js';

// All dependencies are injected: these tests cannot contact database, Cloudinary or AI hosts.
function load(file: string, dependencies: Record<string, unknown>, globals: Record<string, unknown> = {}) {
  const exports: Record<string, any> = {};
  const source = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  vm.runInNewContext(source,{exports,Date,Buffer,Blob,FormData,Uint8Array,AbortSignal,console:{log(){},error(){}},...globals,
    require:(name:string)=>{if(name in dependencies)return dependencies[name];throw Error('Unexpected dependency '+name);}});
  return exports;
}
const serviceFile='backend/src/services/ai.service.ts';
const uuid='11111111-1111-4111-8111-111111111111';
function fixture(status='success') {
  const predicted=['success','low_confidence'].includes(status);
  const reasons:Record<string,string>={rejected_non_cat:'non_cat',rejected_multiple_cats:'multiple_cats_detected',cannot_predict:'unclear_cat'};
  return {status,validation:{accepted_as_domestic_cat:status!=='rejected_non_cat',cat_probability:status==='rejected_non_cat'?0.1:0.99,threshold:0.56},
    cat_count:status==='rejected_non_cat'?0:status==='rejected_multiple_cats'?2:1,
    rejection:{reason:reasons[status]??null,message:predicted?null:'Safe rejection'},
    prediction:{emotion:predicted?'happy':null,confidence:predicted?0.7:null,
      probabilities:{angry:predicted?0.1:null,fearful:predicted?0.1:null,happy:predicted?0.7:null,neutral:predicted?0.1:null},
      route:predicted?'gated_fusion':status==='rejected_non_cat'?'cat_validation':status==='rejected_multiple_cats'?'multiple_cat_rejection':'detection_failure'}};
}
async function run(input: unknown, dbFails=false, networkError=false) {
  const counts={upload:0,cat:0,image:0,detection:0,recommendations:0,rollback:0};
  const sharp=()=>({metadata:async()=>({format:'jpeg'})});
  const service=load(serviceFile,{sharp},{process:{env:{AI_SERVICE_URL:'http://local-test.invalid'}},fetch:async()=>{if(networkError)throw Error('timeout');return{ok:true,json:async()=>input};}});
  const tx={cats:{create:async()=>{counts.cat++;return{cat_id:uuid};}},cat_images:{create:async({data}:any)=>{counts.image++;assert.equal(data.is_saved_to_album,false);return{image_id:uuid};}},
    emotion_categories:{findUnique:async()=>({emotion_id:uuid})},emotion_detections:{create:async()=>{counts.detection++;return{detection_id:uuid};}}};
  const prisma={recommendations:{findMany:async()=>{counts.recommendations++;return[{recommendation_text:'Existing recommendation'}];}},
    $transaction:async(fn:any)=>{if(dbFails)throw Error('DB failed');return fn(tx);}};
  const controller=load('backend/src/controllers/detection.controller.ts',{
    '../config/db.config.js':prisma,'../services/ai.service.js':service,
    '../services/cloudinary.service.js':{uploadImageToCloudinary:async()=>{counts.upload++;return{url:'https://example.com/cat.jpg',publicId:'public'};},deleteImageFromCloudinary:async()=>{counts.rollback++;}},
    '../utils/constants.js':{UNKNOWN_ALBUM_NAME:'Unknown Cats'},'../utils/validators.js':{isUuid:()=>true}});
  const response={code:0,body:null as any,status(n:number){this.code=n;return this;},json(body:any){this.body=body;return this;}};
  await controller.detectEmotion({profileId:uuid,file:{buffer:Buffer.from('fixture'),mimetype:'image/jpeg'}},response);
  return {counts,response};
}
for(const status of ['low_confidence','rejected_non_cat','rejected_multiple_cats','cannot_predict'])test(status+' preserves structured outcome and makes zero storage/recommendation calls',async()=>{
 const {counts,response}=await run(fixture(status));assert.equal(response.code,200);assert.equal(response.body.status,status);
 assert.deepEqual(Object.values(counts),[0,0,0,0,0,0]);assert.equal(response.body.imageId,undefined);assert.equal(response.body.detectionId,undefined);
});
test('success persists exactly once, preserves IDs/recommendations and initial history-only membership',async()=>{
 const {counts,response}=await run(fixture());assert.deepEqual(Object.values(counts),[1,1,1,1,1,0]);assert.equal(response.code,200);assert.equal(response.body.status,'success');assert.equal(response.body.imageId,uuid);assert.equal(response.body.recommendations[0],'Existing recommendation');assert.equal(response.body.emotion,'Happy');
});
test('malformed outcomes fail closed before every storage operation',async()=>{
 for(const mutate of [(d:any)=>d.status='unknown',(d:any)=>d.cat_count=2,(d:any)=>d.cat_count=-1,(d:any)=>d.cat_count=1.5,(d:any)=>delete d.prediction,(d:any)=>d.prediction.emotion='dog',(d:any)=>d.prediction.confidence=NaN,(d:any)=>d.prediction.confidence=Infinity,(d:any)=>d.prediction.confidence='0.7',(d:any)=>d.prediction.probabilities.happy=2,(d:any)=>delete d.prediction.probabilities.fearful]) {
  const data=fixture();mutate(data);const {counts,response}=await run(data);assert.equal(response.code,500);assert.ok(Object.values(counts).every(n=>n===0));
 }
});
test('network/timeout failure cannot save, DB failure rolls back Cloudinary',async()=>{
 const failed=await run(null,false,true);assert.equal(failed.response.code,500);assert.ok(Object.values(failed.counts).every(n=>n===0));
 const db=await run(fixture(),true);assert.equal(db.response.code,500);assert.equal(db.counts.upload,1);assert.equal(db.counts.rollback,1);assert.equal(db.response.body.imageId,undefined);
});
test('public sanitization excludes debug paths, IDs on rejection and arbitrary warning text',()=>{
 const service=load(serviceFile,{sharp:()=>{}});const data={...fixture('rejected_multiple_cats'),imageId:'bad',input:{image:'C:/secret'},warnings:['private'],artifacts:{path:'private'}};
 const parsed=service.parsePredictionOutcome(data);assert.equal(parsed.cat_count,2);assert.equal(parsed.imageId,undefined);assert.equal(parsed.input,undefined);assert.equal(parsed.warnings,undefined);assert.equal(parsed.artifacts,undefined);
});
