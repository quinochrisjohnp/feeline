// Current live API flow: native input and network are injected, never called.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mount,nodes,find}=require('./helpers/frontendHarness.cjs');
const {service,fixture,params}=require('./helpers/predictionFixture.cjs');
const {isDeviceImageUri}=require('../utils/mediaUri.ts');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function cameraHarness({capture=async()=>({uri:'file:///cache/cat.jpg'}),gallery=async()=>({canceled:true,assets:null}),upload=async()=>service.parseDetectionResponse(fixture()),permission={granted:true,canAskAgain:true}}={}){
 let focused=true,settings=0,requested=0;const routes=[],uploads=[],requests=[];
 const screen=mount('app/(screens)/(tabs)/camera.tsx',{router:{push:r=>routes.push(r)},globals:{console:{log(){},error(){}}},dependencies:{
 '@/services/detection':{...service,uploadDetection:async uri=>{uploads.push(uri);return upload(uri);}},
 '@/hooks/useCameraTipsPreference':{useCameraTipsPreference:()=>({enabled:false,ready:true})},
 '@react-navigation/native':{useIsFocused:()=>focused},
 'expo-camera':{CameraView:'CameraView',useCameraPermissions:()=>[permission,async()=>{requested++;},async()=>permission]},
 'expo-image-picker':{launchImageLibraryAsync:async o=>{requests.push(o);return gallery();}},
 'react-native':{StyleSheet:{create:s=>s},AppState:{currentState:'active',addEventListener:()=>({remove(){}})},Linking:{openSettings:async()=>{settings++;}},Platform:{OS:'android'},View:'View',Text:'Text',TouchableOpacity:'TouchableOpacity',ScrollView:'ScrollView',ActivityIndicator:'ActivityIndicator'}
 }});
 screen.render();let cleanup=screen.focus[0]();const render=()=>screen.render();
 return {render,routes,uploads,requests,
 ready:()=>{const preview=find(render(),'CameraView');preview.props.ref.current={takePictureAsync:capture};preview.props.onCameraReady();},
 capture:()=>find(render(),'/CaptureButton').props.onPress(),
 gallery:()=>nodes(render()).find(n=>n.props?.accessibilityLabel==='Choose image from gallery').props.onPress(),
 blur:()=>{focused=false;cleanup();},focus:()=>{focused=true;render();cleanup=screen.focus[0]();},
 get settings(){return settings;},get requested(){return requested;}};
}
test('capture waits for readiness; rapid taps upload and navigate only once',async()=>{
 const pending=deferred();let captures=0;const c=cameraHarness({capture:async()=>{captures++;return {uri:'file:///real.jpg'};},upload:()=>pending.promise});
 await c.capture();assert.equal(captures,0);c.ready();const first=c.capture();await c.capture();await Promise.resolve();assert.equal(captures,1);assert.deepEqual(c.uploads,['file:///real.jpg']);assert.equal(c.routes.length,0);
 pending.resolve(service.parseDetectionResponse(fixture()));await first;assert.equal(c.routes.length,1);await c.capture();assert.equal(c.routes.length,1);
 const route=c.routes[0];assert.equal(route.params.source,'camera');assert.equal(JSON.parse(route.params.result).imageUrl,fixture().imageUrl);
 const result=mount('app/(screens)/camera-result.tsx',{params:route.params,router:{replace:r=>c.routes.push(r)}});
 assert.equal(find(result.render(),'/DraggableDetailsLayout').props.imageUri,fixture().imageUrl);
 const save=find(result.render(),'/DetailScreenHeader').props.rightElement;save.props.onPress();save.props.onPress();assert.equal(c.routes.length,2);assert.equal(JSON.parse(c.routes[1].params.result).detectionId,fixture().detectionId);
});
test('gallery uses one unedited image; returned API image and source reach Result',async()=>{
 const c=cameraHarness({gallery:async()=>({canceled:false,assets:[{uri:'content://media/photos/22'}]})});await c.gallery();assert.deepEqual(c.uploads,['content://media/photos/22']);assert.equal(c.routes[0].params.source,'gallery');
 assert.deepEqual(JSON.parse(JSON.stringify(c.requests[0])),{mediaTypes:['images'],allowsMultipleSelection:false,allowsEditing:false,quality:1});
});
test('gallery cancel, failure and missing assets never upload or navigate and unlock controls',async()=>{
 for(const gallery of [async()=>({canceled:true,assets:null}),async()=>{throw Error('denied');},async()=>({canceled:false,assets:[]})]){const c=cameraHarness({gallery});c.ready();await c.gallery();assert.equal(c.routes.length,0);assert.equal(c.uploads.length,0);assert.equal(find(c.render(),'/CaptureButton').props.disabled,false);}
});
test('capture failures unlock for retry without uploading',async()=>{
 for(const capture of [async()=>{throw Error('native failure');},async()=>({})]){const c=cameraHarness({capture});c.ready();await c.capture();assert.equal(c.routes.length,0);assert.equal(c.uploads.length,0);assert.equal(find(c.render(),'/CaptureButton').props.disabled,false);}
});
test('leaving cancels late native input and API response navigation',async()=>{
 for(const stage of ['camera','gallery','upload']){const late=deferred();const c=cameraHarness(stage==='camera'?{capture:()=>late.promise}:stage==='gallery'?{gallery:()=>late.promise}:{upload:()=>late.promise});c.ready();const run=stage==='gallery'?c.gallery():c.capture();await Promise.resolve();c.blur();assert.equal(find(c.render(),'CameraView'),undefined);c.focus();late.resolve(stage==='camera'?{uri:'file:///late.jpg'}:stage==='gallery'?{canceled:false,assets:[{uri:'file:///late.jpg'}]}:service.parseDetectionResponse(fixture()));await run;assert.equal(c.routes.length,0);assert.equal(find(c.render(),'/CaptureButton').props.disabled,true);}
});
test('returning remounts the full-screen preview and permits a second capture',async()=>{
 const c=cameraHarness();const first=find(c.render(),'CameraView');assert.ok(first);c.ready();await c.capture();c.blur();assert.equal(find(c.render(),'CameraView'),undefined);c.focus();const second=find(c.render(),'CameraView');assert.ok(second);assert.equal(find(c.render(),'/CaptureButton').props.disabled,true);assert.deepEqual(second.props.style,first.props.style);c.ready();await c.capture();assert.equal(c.routes.length,2);
});
test('permission states require explicit action and keep gallery available; mount errors retry',async()=>{
 for(const permission of [null,{granted:false,canAskAgain:true},{granted:false,canAskAgain:false}]){const c=cameraHarness({permission});assert.equal(find(c.render(),'CameraView'),undefined);assert.equal(c.requested,0);await c.gallery();assert.equal(c.requests.length,1);if(permission){nodes(c.render()).find(n=>n.props?.label===(permission.canAskAgain?'Allow Camera Access':'Open Settings')).props.onPress();assert.equal(permission.canAskAgain?c.requested:c.settings,1);}}
 const c=cameraHarness();find(c.render(),'CameraView').props.onMountError({message:'private details'});assert.equal(find(c.render(),'CameraView'),undefined);nodes(c.render()).find(n=>n.props?.label==='Retry Camera').props.onPress();assert.ok(find(c.render(),'CameraView'));
});
test('device URI validation rejects remote and malformed media',()=>{
 for(const uri of ['file:///cache/cat.jpg','content://media/photos/1','ph://photo-id','assets-library://asset/photo.jpg','blob:http://localhost/id','data:image/jpeg;base64,Y2F0'])assert.equal(isDeviceImageUri(uri),true);
 for(const uri of [undefined,[],['file:///cat.jpg'],'','file://','javascript:alert(1)','https://example.com/cat.jpg','file:///cache/%zz'])assert.equal(isDeviceImageUri(uri),false);
});
test('result retains one photo/card scroll area with fixed header and safe bottom',()=>{
 const screen=mount('app/(screens)/camera-result.tsx',{params:params()});const tree=screen.render(),panel=find(tree,'/DraggableDetailsLayout');assert.ok(find(tree,'/DetailScreenHeader'));assert.ok(find(panel,'/EmotionResultCard'));assert.equal(panel.props.imageUri,fixture().imageUrl);assert.equal(find(panel,'/DetailScreenHeader'),undefined);assert.deepEqual(Array.from(tree.props.edges),['left','right']);
});

test("What to Avoid uses all six assets in three rows and closes through Continue", () => {
  let closed = 0;
  const assets = Object.fromEntries(["cat_blurred", "cat_dark", "dog", "cat_cropped", "cat_multiple", "cat_deformaties"].map((name) => [`../images/${name}.png`, name]));
  const screen = mount("components/camera/WhatToAvoidModal.tsx", {
    props: { visible: true, onClose: () => closed++ },
    dependencies: { ...assets, "react-native": { StyleSheet: { create: (s) => s }, useWindowDimensions:()=>({height:800,fontScale:1}), View: "View", Text: "Text", Image: "Image" } },
  });
  const tree = screen.render();
  assert.equal(tree.props.compact, true);
  assert.equal(tree.props.visible, true);
  const images = nodes(tree).filter((n) => n.type === "Image");
  assert.deepEqual(images.map((n) => n.props.source), ["cat_blurred", "cat_dark", "dog", "cat_cropped", "cat_multiple", "cat_deformaties"]);
  assert.ok(images.every((n) => n.props.resizeMode === "cover"));
  find(tree, "/Button").props.onPress();
  assert.equal(closed, 1);
});


test("result photo shape follows portrait, landscape, square and decoder dimensions without a colored frame", () => {
  for (const [width, height] of [[1080, 1920], [1920, 1080], [600, 600]]) {
    const uri = "file:///cache/photo.jpg";
    const photo = mount("components/camera/MockCapturePhoto.tsx", {
      props: { imageUri: uri, imageWidth: width, imageHeight: height },
      dependencies: { "expo-image": { Image: "ExpoImage" }, "@/data/bundledCatImages": { getBundledCatImage: () => undefined } },
    });
    const tree = photo.render();
    assert.equal(tree.props.style[1].aspectRatio, width / height);
    assert.equal(tree.props.style[0].backgroundColor, undefined);
    assert.equal(tree.props.style[0].width, "100%");
    const image = find(tree, "ExpoImage");
    assert.equal(image.props.source.uri, uri);
    assert.equal(image.props.contentFit, "contain");
    image.props.onLoad({ source: { width: 900, height: 1600 } });
    assert.equal(photo.render().props.style[1].aspectRatio, 900 / 1600);
  }
});
