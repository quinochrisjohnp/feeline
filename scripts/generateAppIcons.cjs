// Icon composition only. Preserve the supplied original and all branding uses.
const fs = require('node:fs');
const Jimp = require('jimp-compact'); // Existing Expo image tooling.
(async () => {
  const art = await Jimp.read('components/images/logo-only.png');
  // Match the near-white paper matte to the adaptive background; retain colored artwork.
  art.scan(0,0,art.bitmap.width,art.bitmap.height,function(_x,_y,i){
    const d=this.bitmap.data;
    const m=Math.max(0,Math.min(1,(Math.min(d[i],d[i+1],d[i+2])-225)/10));
    [255,247,233].forEach((v,c)=>{d[i+c]=Math.round(d[i+c]*(1-m)+v*m);});d[i+3]=255;
  });
  const foreground=new Jimp(1024,1024,0xfff7e9ff);
  foreground.composite(art.clone().resize(660,660),182,182);
  await foreground.writeAsync('components/images/logo-adaptive-foreground.png');
  await art.resize(1024,1024).writeAsync('components/images/logo-ios.png');
  const config=JSON.parse(fs.readFileSync('app.json','utf8'));
  config.expo.icon='./components/images/logo-only.png';
  config.expo.android.icon='./components/images/logo-ios.png';
  config.expo.android.adaptiveIcon={foregroundImage:'./components/images/logo-adaptive-foreground.png',backgroundColor:'#FFF7E9'};
  config.expo.ios.icon='./components/images/logo-ios.png';
  fs.writeFileSync('app.json',JSON.stringify(config,null,2)+'\n');
})();
