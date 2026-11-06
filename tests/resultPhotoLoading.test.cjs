const test=require('node:test'),assert=require('node:assert/strict');
const {mount,find,nodes}=require('./helpers/frontendHarness.cjs');
const spinner=tree=>nodes(tree).find(n=>typeof n?.type==='function'&&n.type.name==='CatPhotoSpinner');
test('result photo loader is local, ends on load or error, and uses a contained image',()=>{
 for(const outcome of ['onLoad','onError']){
 const screen=mount('components/common/LoadingPhoto.tsx',{props:{imageUri:'https://example.com/cat.jpg'}});
 let tree=screen.render();assert.ok(spinner(tree));const photo=find(tree,'./MockPhoto');assert.equal(photo.props.resizeMode,'contain');photo.props[outcome]();tree=screen.render();assert.equal(spinner(tree),undefined);
 assert.equal(nodes(tree).some(n=>n.props?.accessibilityRole==='alert'),outcome==='onError');
 }
});
test('image-only cat animation uses no backdrop, stops on unmount, and respects reduced motion',async()=>{
 for(const reduced of [false,true]){
 let started=0,stopped=0,removed=0;
 class Value{interpolate(v){return v;}stopAnimation(){}setValue(){}}
 const screen=mount('components/common/LoadingPhoto.tsx',{componentName:'CatPhotoSpinner',dependencies:{'../images/loading-icon.png':'cat-icon',
 'react-native':{View:'View',Text:'Text',Image:'Image',StyleSheet:{absoluteFillObject:{position:'absolute',top:0,right:0,bottom:0,left:0},create:s=>s},Easing:{linear:'linear'},
 AccessibilityInfo:{isReduceMotionEnabled:async()=>reduced,addEventListener:()=>({remove(){removed++;}})},
 Animated:{Value,View:'AnimatedView',timing:(_v,options)=>{assert.equal(options.useNativeDriver,true);return{};},loop:()=>({start(){started++;},stop(){stopped++;}})}}}});
 screen.render();await Promise.resolve();const tree=screen.render();assert.equal(tree.props.style.backgroundColor,undefined);assert.equal(tree.props.style.position,'absolute');assert.equal(tree.props.pointerEvents,'none');assert.equal(find(tree,'Image').props.source,'cat-icon');assert.equal(nodes(tree).filter(n=>n.type==='Image').length,1);assert.equal(started,reduced?0:1);screen.unmount();assert.equal(stopped,reduced?0:1);assert.equal(removed,1);
 }
});
test('Feedback native fields cap input and submission rejects messages over 500',async()=>{
 let requests=0;const screen=mount('app/(screens)/settings-feedback.tsx',{dependencies:{'@/services/api':{apiFetch:async()=>{requests++;return {ok:true,json:async()=>({status:'success'})};}}}});
 const field=label=>nodes(screen.render()).find(n=>n.props?.label===label);
 for(const [name,max] of [['Title',150],['Email',255],['Subject',255],['Message',500]])assert.equal(field(name).props.maxLength,max);
 for(const [label,value] of [['Title','Test'],['Email','me@example.com'],['Subject','Feedback'],['Message','x'.repeat(501)]])field(label).props.onChangeText(value);
 await field('Submit').props.onPress();assert.equal(requests,0);assert.match(field('Message').props.error,/500/);
 field('Message').props.onChangeText('x'.repeat(500));await field('Submit').props.onPress();assert.equal(requests,1);
});
