const test=require("node:test"),assert=require("node:assert/strict");
const {mount,find,nodes}=require("./helpers/frontendHarness.cjs");
function loading(reduced) {
  let onChange,announcements=0,removed=0;const loops=[],timings=[],values=[];
  class Value { constructor(v){this.value=v;values.push(this);} interpolate(x){return x;} stopAnimation(){this.stopped=true;} setValue(v){this.value=v;} }
  const Animated={Value,View:"AnimatedView",timing:(value,options)=>{timings.push(options);return {value,options};},
    sequence:items=>({items}),delay:duration=>({duration}),loop:animation=>{const loop={animation,start(){this.started=true;},stop(){this.stopped=true;}};loops.push(loop);return loop;}};
  const screen=mount("components/loading/FeelineLoadingOverlay.tsx",{dependencies:{
    "../images/loading-icon.png":"loading-icon.png","expo-status-bar":{StatusBar:"StatusBar"},
    "react-native":{Animated,Easing:{inOut:x=>x,sin:"sin",linear:"linear"},
      AccessibilityInfo:{isReduceMotionEnabled:async()=>reduced,addEventListener:(_,fn)=>{onChange=fn;return {remove(){removed++;}};},announceForAccessibility:()=>announcements++},
      View:"View",Text:"Text",Image:"Image",ActivityIndicator:"ActivityIndicator",StyleSheet:{create:s=>s},
      useWindowDimensions:()=>({width:320,height:568})},
  }});
  return {screen,loops,timings,values,change:v=>onChange(v),announcements:()=>announcements,removed:()=>removed};
}
test("loading uses contain and native gentle loops, then stops all animations/listeners on unmount",async()=>{
  const h=loading(false);h.screen.render();await Promise.resolve();const tree=h.screen.render();
  assert.equal(h.loops.length,4);assert.ok(h.loops.every(l=>l.started));assert.ok(h.timings.every(t=>t.useNativeDriver));
  assert.ok(h.timings.some(t=>t.duration===14000));
  const image=find(tree,"Image");assert.equal(image.props.resizeMode,"contain");assert.equal(image.props.style.width,image.props.style.height);
  assert.equal(image.props.source,"loading-icon.png");
  assert.equal(h.announcements(),1);h.screen.render();assert.equal(h.announcements(),1);
  assert.ok(nodes(tree).some(n=>n.props?.pointerEvents==="none"&&n.props?.importantForAccessibility==="no-hide-descendants"));
  h.screen.unmount();assert.ok(h.loops.every(l=>l.stopped));assert.equal(h.removed(),1);
});
test("reduced motion stays static, and enabling it later stops existing loops",async()=>{
  const reduced=loading(true);reduced.screen.render();await Promise.resolve();assert.ok(find(reduced.screen.render(),"ActivityIndicator"));assert.equal(reduced.loops.length,0);
  const changing=loading(false);changing.screen.render();await Promise.resolve();changing.screen.render();
  changing.change(true);assert.ok(find(changing.screen.render(),"ActivityIndicator"));assert.ok(changing.loops.every(l=>l.stopped));
  reduced.screen.unmount();changing.screen.unmount();
});
