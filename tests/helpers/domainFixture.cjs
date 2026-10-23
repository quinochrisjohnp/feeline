// Explicit test data: production starts empty and loads authenticated API data.
const {mockCats}=require('../../data/mockCats.ts');
const {mockSavedImages,mockDetectionRecords}=require('../../data/mockDetectionRecords.ts');
exports.createState=()=>structuredClone({cats:mockCats,albums:[...mockCats.map(c=>({id:'album-'+c.id,kind:'cat',catId:c.id})),{id:'unknown-cats',kind:'unknown',catId:null}],images:mockSavedImages,detectionRecords:mockDetectionRecords});
