const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {mount,nodes,find}=require('./helpers/frontendHarness.cjs');
function load(api=async()=>{throw Error('Unexpected network');}) {
 const exports={};const source=ts.transpileModule(fs.readFileSync('services/detection.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(source,{exports,FormData,console,require:id=>id==='./api'?{apiFetch:api}:require('../types/models.ts')});return exports;
}
const service=load(),uuid='11111111-1111-4111-8111-111111111111';
function fixture(status='success') {
 const predicted=['success','low_confidence'].includes(status);
 const reason={rejected_non_cat:'non_cat',rejected_multiple_cats:'multiple_cats_detected',cannot_predict:'unclear_cat'};
 return {status,validation:{accepted_as_domestic_cat:status!=='rejected_non_cat',cat_probability:status==='rejected_non_cat'?0.1:0.99,threshold:0.56},cat_count:status==='rejected_non_cat'?0:status==='rejected_multiple_cats'?2:1,
 rejection:{reason:reason[status]??null,message:predicted?null:'Rejection'},prediction:{emotion:predicted?'happy':null,confidence:predicted?0.7:null,probabilities:{angry:predicted?0.1:null,fearful:predicted?0.1:null,happy:predicted?0.7:null,neutral:predicted?0.1:null},route:predicted?'gated_fusion':status==='rejected_non_cat'?'cat_validation':status==='rejected_multiple_cats'?'multiple_cat_rejection':'detection_failure'},
 ...(status==='success'?{catId:uuid,imageId:uuid,detectionId:uuid,imageUrl:'https://example.com/cat.jpg',recommendations:['Existing advice']}: {})};
}
test('HTTP 200 semantic outcomes remain structured; invalid response fails closed',async()=>{
 for(const status of ['success','low_confidence','rejected_non_cat','rejected_multiple_cats','cannot_predict']){
  const s=load(async()=>({ok:true,json:async()=>fixture(status)}));const result=await s.uploadDetection('file:///photo.jpg');assert.equal(result.status,status);assert.equal(result.cat_count,fixture(status).cat_count);
 }
 for(const mutate of [d=>d.status='unknown',d=>d.cat_count='2',d=>d.cat_count=2,d=>delete d.prediction,d=>d.prediction.confidence=Infinity,d=>delete d.prediction.probabilities.happy]){
  const d=fixture();mutate(d);assert.throws(()=>service.parseDetectionResponse(d));assert.equal(service.parseDetectionRoute(JSON.stringify(d)),null);
 }
});
test('status messages use validated count and never parse errors',()=>{
 const {detectionOutcomeNotice,detectionFailureNotice}=require('../utils/cameraPresentation.ts');
 for(const [status,title] of [['rejected_non_cat','No cat detected'],['rejected_multiple_cats','Multiple cats detected'],['cannot_predict','Cat could not be analyzed'],['low_confidence','Emotion unclear']]){
  const result=service.parseDetectionResponse(fixture(status));const n=detectionOutcomeNotice(result);assert.equal(n.title,title);if(status==='rejected_multiple_cats')assert.match(n.message,/detected 2 cats/);
 }
 assert.equal(detectionFailureNotice(Error('rejected_multiple_cats 300')).title,'Detection unavailable');
});
test('result and save reject direct navigation with rejected, missing, duplicated or malformed envelopes',()=>{
 for(const file of ['app/(screens)/camera-result.tsx','app/(screens)/camera-save.tsx'])for(const value of [undefined,[],[JSON.stringify(fixture())],'{bad',JSON.stringify(fixture('low_confidence')),JSON.stringify(fixture('cannot_predict')),JSON.stringify({...fixture(),cat_count:2})]){
  const screen=mount(file,{params:{result:value,capturedAt:'2026-10-23T00:00:00.000Z',imageUri:'file:///fake',detectionId:uuid,emotion:'happy',confidence:'90'},context:()=>({state:{cats:[],albums:[],images:[],detectionRecords:[]}}),dependencies:{'@/services/detection':service}});
  assert.equal(find(screen.render(),'/EmotionResultCard'),undefined);assert.equal(nodes(screen.render()).find(n=>n.props?.label==='Save'),undefined);
 }
});
test('valid result preserves envelope through one Save route and Album assignment does not upload again',async()=>{
 const accepted=service.parseDetectionResponse(fixture()),routes=[];const params={result:JSON.stringify(accepted),capturedAt:'2026-10-23T00:00:00.000Z',source:'camera'};
 const screen=mount('app/(screens)/camera-result.tsx',{params,router:{replace:r=>routes.push(r)},dependencies:{'@/services/detection':service}});
 const tree=screen.render();assert.ok(find(tree,'/EmotionResultCard'));const save=find(tree,'/DetailScreenHeader').props.rightElement;save.props.onPress();save.props.onPress();assert.equal(routes.length,1);assert.equal(JSON.parse(routes[0].params.result).imageUrl,accepted.imageUrl);
 const calls=[];const s=load(async(path,options)=>{calls.push({path,options});return{ok:true,json:async()=>({detectionId:uuid})};});await s.assignDetectionToCat(uuid,uuid);await s.saveDetectionToUnknown(uuid);assert.ok(calls.every(c=>c.options.method==='PATCH'&&c.path.endsWith('/album')));
});
test('every non-success stays on Camera without result navigation or persistence callbacks',async()=>{
 const session=require('../utils/cameraPresentation.ts');
 for(const status of ['low_confidence','rejected_non_cat','rejected_multiple_cats','cannot_predict','network']){
  let attempts=0;const routes=[];const screen=mount('app/(screens)/(tabs)/camera.tsx',{router:{push:r=>routes.push(r)},globals:{performance,console:{log(){},error(){}}},dependencies:{
   '@/services/detection':{...service,uploadDetection:async()=>{attempts++;if(status==='network')throw Error('timeout');return service.parseDetectionResponse(fixture(status));}},'@/utils/cameraPresentation':session,
   '@/hooks/useCameraTipsPreference':{useCameraTipsPreference:()=>({enabled:false,ready:true})},'@/context/WellnessContext':{useWellness:()=>({setCameraSafe(){}})},
   '@react-navigation/native':{useIsFocused:()=>true},'expo-camera':{CameraView:'CameraView',useCameraPermissions:()=>[{granted:true},async()=>{},async()=>{}]},
   'react-native':{StyleSheet:{create:s=>s},AppState:{currentState:'active',addEventListener:()=>({remove(){}})},View:'View',Text:'Text',TouchableOpacity:'TouchableOpacity',ScrollView:'ScrollView',Platform:{OS:'android'}}}});
  screen.render();screen.focus[0]();const preview=find(screen.render(),'CameraView');preview.props.ref.current={takePictureAsync:async()=>({uri:'file:///cat.jpg'})};preview.props.onCameraReady();await find(screen.render(),'/CaptureButton').props.onPress();assert.equal(routes.length,0);assert.ok(find(screen.render(),'/CameraErrorModal'));assert.equal(find(screen.render(),'/CaptureButton').props.disabled,false);
  assert.ok(find(screen.render(),'/MockPhoto'),'failed photo is in session thumbnail before reset');
  const errorModal=find(screen.render(),'/CameraErrorModal');
  const rendered=mount('components/camera/CameraErrorModal.tsx',{props:errorModal.props}).render();
  nodes(rendered).find(n=>n.props?.label==='Try another photo').props.onPress();
  assert.equal(find(screen.render(),'/MockPhoto'),undefined);assert.equal(find(screen.render(),'/CameraErrorModal'),undefined);
  assert.equal(find(screen.render(),'/FeelineLoadingOverlay'),undefined);assert.equal(find(screen.render(),'/CaptureButton').props.disabled,false);
  await find(screen.render(),'/CaptureButton').props.onPress();assert.equal(attempts,2);assert.equal(routes.length,0);
  find(screen.render(),'/CameraErrorModal').props.onPhotoTips();
  assert.equal(find(screen.render(),'/MockPhoto'),undefined);assert.equal(find(screen.render(),'/CameraErrorModal'),undefined);
  assert.equal(find(screen.render(),'/WhatToAvoidModal').props.visible,true);
 }
});

test('Save screen assigns one existing detection and refreshes history, without a second upload',async()=>{
 const accepted=service.parseDetectionResponse(fixture());let assigned=0,refreshed=0;
 const screen=mount('app/(screens)/camera-save.tsx',{params:{result:JSON.stringify(accepted),capturedAt:'2026-10-23T00:00:00.000Z'},context:()=>({state:{cats:[],albums:[{id:'unknown-cats',kind:'unknown',catId:null}],images:[],detectionRecords:[]},refreshDetections:async()=>{refreshed++;}}),dependencies:{'@/services/detection':{...service,saveDetectionToUnknown:async()=>{assigned++;}}}});
 let tree=screen.render();const list=find(tree,'FlatList');const row=list.props.renderItem({item:{id:'unknown-cats',kind:'unknown',catId:null},index:0});
 const destination=nodes(row).find(n=>n.props?.onPress);destination.props.onPress();tree=screen.render();
 const confirm=nodes(tree).find(n=>n.props?.confirmLabel==='Save');const pending=confirm.props.onConfirm();await confirm.props.onConfirm();await pending;
 assert.equal(assigned,1);assert.equal(refreshed,1);
});

test('exact status copy, dynamic counts and defensive multiple-cat fallback',()=>{
 const {detectionOutcomeNotice,detectionFailureNotice}=require('../utils/cameraPresentation.ts');
 const expected={
 rejected_non_cat:['No cat detected','FeELINE can only analyze photos containing one real domestic cat. Please take or upload another photo.'],
 rejected_multiple_cats:['Multiple cats detected','FeELINE detected 7 cats in this image. Please use a photo containing only one cat.'],
 low_confidence:['Emotion unclear','FeELINE detected a cat but could not confidently determine its emotion. Please try another clear photo.'],
 cannot_predict:['Cat could not be analyzed','FeELINE detected a cat, but the photo could not be analyzed clearly. Please use a clear, well-lit photo showing the cat’s face or body.']};
 for(const [status,[title,message]] of Object.entries(expected)){
  const result=fixture(status);if(status==='rejected_multiple_cats')result.cat_count=7;
  const notice=detectionOutcomeNotice(service.parseDetectionResponse(result));assert.equal(notice.title,title);assert.equal(notice.message,message);
 }
 for(const cat_count of [undefined,null,'3',0,1,-1,2.5,NaN,Infinity])assert.equal(detectionOutcomeNotice({...fixture('rejected_multiple_cats'),cat_count}).message,'FeELINE detected multiple cats in this image. Please use a photo containing only one cat.');
 for(const error of [Error('timeout'),Error('server error'),Error('malformed response')])assert.deepEqual(detectionFailureNotice(error),{title:'Detection unavailable',message:"We couldn't analyze this photo right now. Check your connection, then try again.",photoTips:false});
});

test('invalid-count API rejection stays an error but uses the count-free multiple-cat modal',async()=>{
 const {detectionFailureNotice}=require('../utils/cameraPresentation.ts');
 for(const count of [undefined,null,'two',1,-1,2.5]){
  const data={...fixture('rejected_multiple_cats'),cat_count:count};
  const s=load(async()=>({ok:true,json:async()=>data}));
  await assert.rejects(s.uploadDetection('file:///cat.jpg'),error=>{
   const notice=detectionFailureNotice(error);assert.equal(notice.title,'Multiple cats detected');
   assert.equal(notice.message,'FeELINE detected multiple cats in this image. Please use a photo containing only one cat.');return true;
  });
 }
});
