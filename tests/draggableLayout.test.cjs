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

test('gallery starts hidden, visibly toggles and dismiss callback switches Emotion off without Recorded text',()=>{
 const context=store(),image=context().state.images[0];const screen=mount('app/(screens)/album-photo.tsx',{context,params:{imageId:image.id}});
 const button=()=>nodes(screen.render()).find(n=>n.props?.accessibilityLabel==='Emotion');
 assert.equal(find(screen.render(),'/EmotionResultCard'),undefined);assert.equal(find(screen.render(),'/DraggableDetailsLayout').props.detailsVisible,false);
 button().props.onPress();assert.equal(button().props.accessibilityState.selected,true);assert.ok(find(screen.render(),'/EmotionResultCard'));
 assert.doesNotMatch(JSON.stringify(screen.render()),/Recorded /);
 find(screen.render(),'/DraggableDetailsLayout').props.onDismiss();assert.equal(button().props.accessibilityState.selected,false);assert.equal(find(screen.render(),'/EmotionResultCard'),undefined);
 button().props.onPress();button().props.onPress();assert.equal(find(screen.render(),'/DraggableDetailsLayout').props.detailsVisible,false);
});
test('dismissible photo sheet hides completely on downward snap and preserves footer',()=>{
 const n=native(),props={imageUri:'file:///cat.jpg',detailsVisible:false,footer:'Toolbar',onDismiss:()=>{props.detailsVisible=false;}};
 const screen=mount('components/common/DraggableDetailsLayout.tsx',{props,dependencies:{'react-native':n.module}});
 let tree=screen.render();tree.props.onLayout({nativeEvent:{layout:{height:600}}});assert.equal(find(screen.render(),'ScrollView'),undefined);
 props.detailsVisible=true;screen.render();screen.render();n.handler.onPanResponderGrant();n.handler.onPanResponderMove(null,{dy:1000});n.handler.onPanResponderRelease(null,{vy:1});
 assert.equal(props.detailsVisible,false);tree=screen.render();assert.equal(find(tree,'AnimatedView').props.style[1].height,0);assert.ok(JSON.stringify(tree).includes('Toolbar'));screen.unmount();
});
test('Calendar pan updates shared progress directly and snaps without a JS callback per frame',()=>{
 const values=[],handlers={};let counter=0,bridgeCalls=0;const chain={};for(const name of ['minDistance','onStart','onUpdate','onFinalize'])chain[name]=value=>{handlers[name]=value;return chain;};
 const dependencies={'react-native':{StyleSheet:{create:s=>s}},'react-native-gesture-handler':{Gesture:{Pan:()=>chain}},'react-native-reanimated':{__esModule:true,default:{View:'AnimatedView'},useSharedValue:v=>{const i=counter++%2;return values[i]??(values[i]={value:v});},cancelAnimation(){},ReduceMotion:{System:'system'},runOnJS:fn=>(...args)=>{bridgeCalls++;fn(...args);},withTiming:(value,options,callback)=>{assert.equal(options.reduceMotion,'system');callback?.(true);return value;}}};
 const screen=mount('components/calendar/CalendarDragPanel.tsx',{componentName:'useCalendarPanel',props:{valueOf:()=>340},dependencies});const panel=screen.render();handlers.onStart();const calls=bridgeCalls;
 handlers.onUpdate({translationY:-170});assert.equal(panel.progress.value,.5);assert.equal(bridgeCalls,calls);
 handlers.onUpdate({translationY:-500});assert.equal(panel.progress.value,1);handlers.onFinalize({velocityY:-700},true);assert.equal(panel.progress.value,1);assert.equal(screen.render().settledExpanded,true);screen.unmount();
});
