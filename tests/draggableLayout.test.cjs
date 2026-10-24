const test=require('node:test'),assert=require('node:assert/strict');
const {mount,find,store,nodes}=require('./helpers/frontendHarness.cjs');
function native(reduced=false){
 let handler,stopped=0;const values=[];
 class Value{constructor(v){this.value=v;this.listeners=[];values.push(this);}addListener(fn){this.listeners.push(fn);return 'id';}removeListener(){this.listeners=[];}stopAnimation(){stopped++;}setValue(value){this.value=value;this.listeners.forEach(fn=>fn({value}));}interpolate({outputRange}){return outputRange[0]+this.value*(outputRange[1]-outputRange[0]);}}
 const durations=[];
 return {values,durations,get stopped(){return stopped;},get handler(){return handler;},module:{StyleSheet:{create:s=>s},View:'View',Pressable:'Pressable',ScrollView:'ScrollView',
 AccessibilityInfo:{isReduceMotionEnabled:async()=>reduced,addEventListener:()=>({remove(){}})},
 Animated:{Value,View:'AnimatedView',timing:(v,options)=>({start:cb=>{durations.push(options.duration);v.setValue(options.toValue);cb?.({finished:true});}})},
 PanResponder:{create:h=>{handler=h;return{panHandlers:h};}}}};
}
test('actual shared image sheet contains media, constrains geometry, snaps drag and cleans animation',async()=>{
 const n=native();const screen=mount('components/common/DraggableDetailsLayout.tsx',{props:{imageUri:'file:///portrait.jpg',children:'Details'},dependencies:{'react-native':n.module}});
 let tree=screen.render();tree.props.onLayout({nativeEvent:{layout:{height:600}}});tree=screen.render();
 assert.equal(find(tree,'./MockPhoto').props.resizeMode,'contain');assert.equal(find(tree,'./MockPhoto').props.imageUri,'file:///portrait.jpg');
 assert.equal(find(tree,'AnimatedView').props.style[1].height,264);
 n.handler.onPanResponderGrant();n.handler.onPanResponderMove(null,{dy:-102});tree=screen.render();assert.equal(find(tree,'AnimatedView').props.style[1].height,366);
 n.handler.onPanResponderRelease(null,{vy:-1});tree=screen.render();assert.equal(find(tree,'AnimatedView').props.style[1].height,468);
 n.handler.onPanResponderGrant();n.handler.onPanResponderMove(null,{dy:2000});n.handler.onPanResponderRelease(null,{vy:1});tree=screen.render();assert.equal(find(tree,'AnimatedView').props.style[1].height,264);
 assert.equal(find(tree,'ScrollView').props.onScroll,undefined);screen.unmount();assert.ok(n.stopped>0);
});
test('reduced motion snaps without timed animation',async()=>{const n=native(true);const s=mount('components/common/DraggableDetailsLayout.tsx',{props:{imageUri:'file:///landscape.jpg'},dependencies:{'react-native':n.module}});s.render();await Promise.resolve();n.handler.onPanResponderRelease(null,{vy:-1});assert.equal(n.durations[0],0);s.unmount();});
test('profile detail Edit uses current API-backed cat and saves through existing context',async()=>{const context=store();const screen=mount('app/(screens)/(tabs)/status.tsx',{context});let tree=screen.render();const card=nodes(tree).find(n=>n.type==='@/components/cats/CatCoverCard'); assert.ok(card);card.props.onPress();tree=screen.render();const edit=nodes(tree).find(n=>n.props?.accessibilityLabel?.startsWith('Edit ')&&n.props.accessibilityLabel.endsWith(' profile'));assert.ok(edit);edit.props.onPress();const form=find(screen.render(),'/AddCatForm');assert.ok(form.props.initialCat);await form.props.onSave({...form.props.initialCat,name:'Updated cat'});assert.equal(context().state.cats.find(c=>c.id===form.props.initialCat.id).name,'Updated cat');});
