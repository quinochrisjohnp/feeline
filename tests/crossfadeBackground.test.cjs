const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('./helpers/frontendHarness.cjs');
require.extensions['.png']=(m,p)=>m.exports=p;
test('Album/Profile/Gallery restore static BG3 without any crossfade animation',()=>{
 const {moduleBackgroundConfig}=require('../constants/moduleBackgrounds.ts');
 for(const name of ['album','catProfile','gallery']){
  assert.ok(moduleBackgroundConfig[name].image.endsWith('bg3.png'));
  assert.equal(moduleBackgroundConfig[name].crossfadeImage,undefined);
 }
 assert.equal(fs.existsSync('components/common/CrossfadeBackground.tsx'),false);
 assert.doesNotMatch(fs.readFileSync('components/common/ModuleBackground.tsx','utf8'),/Animated|Crossfade/);
});
