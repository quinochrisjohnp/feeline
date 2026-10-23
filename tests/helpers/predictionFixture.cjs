const fs=require('fs'),vm=require('vm'),ts=require('typescript');
const uuid='11111111-1111-4111-8111-111111111111';
function fixture(status='success') {
 const predicted=['success','low_confidence'].includes(status);
 const reason={rejected_non_cat:'non_cat',rejected_multiple_cats:'multiple_cats_detected',cannot_predict:'unclear_cat'};
 return {status,validation:{accepted_as_domestic_cat:status!=='rejected_non_cat',cat_probability:status==='rejected_non_cat'?0.1:0.99,threshold:0.56},cat_count:status==='rejected_non_cat'?0:status==='rejected_multiple_cats'?2:1,
 rejection:{reason:reason[status]??null,message:predicted?null:'Rejection'},prediction:{emotion:predicted?'happy':null,confidence:predicted?0.7:null,probabilities:{angry:predicted?0.1:null,fearful:predicted?0.1:null,happy:predicted?0.7:null,neutral:predicted?0.1:null},route:predicted?'gated_fusion':status==='rejected_non_cat'?'cat_validation':status==='rejected_multiple_cats'?'multiple_cat_rejection':'detection_failure'},
 ...(status==='success'?{catId:uuid,imageId:uuid,detectionId:uuid,imageUrl:'https://example.com/cat.jpg',recommendations:['Existing advice']}: {})};
}
const output={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('services/detection.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:output,FormData,console,require:id=>{if(id==='./api')return {apiFetch:async()=>{throw Error('Unexpected network in unit test');}};return require('../../types/models.ts');}});
exports.service=output;exports.fixture=fixture;
exports.params=(source='camera')=>({result:JSON.stringify(fixture()),capturedAt:'2026-09-18T08:30:00.000Z',source,imageUri:fixture().imageUrl});
