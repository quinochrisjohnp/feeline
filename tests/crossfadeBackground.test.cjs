const test=require('node:test'),assert=require('node:assert/strict');
const {mount,nodes}=require('./helpers/frontendHarness.cjs');
test('contained background holds/fades only while focused; reduced motion and unmount stop it',async()=>{
 let focused=true,motion,app,started=0,stopped=0,removed=0;const timings=[],delays=[];
 class Value{stopAnimation(){}setValue(){}}
 const dependencies={'@react-navigation/native':{useIsFocused:()=>focused},'react-native':{
 View:'View',Image:'Image',StyleSheet:{create:s=>s,absoluteFillObject:{position:'absolute'}},
 AccessibilityInfo:{isReduceMotionEnabled:async()=>false,addEventListener:(_e,f)=>{motion=f;return{remove(){removed++}}}},
 AppState:{currentState:'active',addEventListener:(_e,f)=>{app=f;return{remove(){removed++}}}},Easing:{inOut:x=>x,sin:'sin'},
 Animated:{Value,View:'AnimatedView',timing:(_v,o)=>{timings.push(o);return o},delay:n=>{delays.push(n);return n},sequence:s=>s,loop:()=>({start(){started++},stop(){stopped++}})}}};
 const screen=mount('components/common/CrossfadeBackground.tsx',{dependencies,props:{source:1,nextSource:2,style:{position:'absolute'},testID:'bg'}});
 let tree=screen.render();assert.equal(nodes(tree).find(n=>n.type==='AnimatedView').props.style[1].opacity,0);
 for(const n of nodes(tree).filter(n=>n.type==='Image')){assert.equal(n.props.resizeMode,'contain');n.props.onLoad();}
 await Promise.resolve();screen.render();assert.equal(started,1);assert.deepEqual(delays,[3500,3500]);assert.ok(timings.every(t=>t.duration===6000&&t.useNativeDriver&&!t.isInteraction));
 focused=false;screen.render();assert.equal(stopped,1);focused=true;screen.render();motion(true);tree=screen.render();assert.equal(stopped,2);assert.equal(nodes(tree).find(n=>n.type==='AnimatedView').props.style[1].opacity,0);
 motion(false);screen.render();app('background');screen.render();assert.equal(stopped,3);app('active');screen.render();screen.unmount();assert.equal(stopped,4);assert.equal(removed,2);
});
