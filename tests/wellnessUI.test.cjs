const test=require("node:test"),assert=require("node:assert/strict");
const {mount,nodes,find}=require("./helpers/frontendHarness.cjs");
const {wellnessDisclaimer}=require("../constants/wellnessGuidance.ts");
const cat={id:"cat",name:"Mimi",photoUri:null};
const alert={signature:"pattern",catId:"cat",rule:"similar_time_pattern",status:"pending",from:"2026-10-19T08:00:00Z",through:"2026-10-21T08:00:00Z",detectionIds:["1","2","3"]};
const theme={colors:{},fontFamily:{},typography:{},spacing:{},dimensions:{},radii:{}};
test("wellness modal names the cat, asks relevant questions, expands safely, and wires both actions",()=>{
  let ack=0,remind=0;
  const screen=mount("components/wellness/WellnessCheckInModal.tsx",{props:{cat,alert,onAcknowledge:()=>ack++,onRemind:()=>remind++,onClose(){},busy:false,error:null}});
  let tree=screen.render();
  assert.equal(find(tree,"./WellnessCatHeader").props.cat,cat);
  const text=nodes(tree).filter(n=>n.type==="Text").map(n=>n.props.children).flat().join(" ");
  assert.match(text,/Mimi/);assert.match(text,/poorly ventilated/);assert.ok(text.includes(wellnessDisclaimer));assert.match(text,/do not need to wait/);
  const expand=nodes(tree).find(n=>n.props?.accessibilityState?.expanded===false);expand.props.onPress();
  const expanded=nodes(screen.render()).filter(n=>n.type==="Text").map(n=>n.props.children).flat().join(" ");
  assert.match(expanded,/approach voluntarily/);assert.doesNotMatch(expanded,/scruff|protective gloves|restrain.*towel/i);
  nodes(tree).find(n=>n.props?.label==="Okay, I’ll check").props.onPress();
  nodes(tree).find(n=>n.props?.label==="Remind me later").props.onPress();assert.equal(ack,1);assert.equal(remind,1);
  const header=mount("components/wellness/WellnessCatHeader.tsx",{props:{cat}}).render();
  const photo=find(header,"/MockPhoto");assert.equal(photo.props.imageUri,null);assert.equal(photo.props.icon,"paw");
});
test("global due check-in opens once and waits for screen/modal safety",async()=>{
  let focused=true,blocked=true;const presented=new Set(),reminders=[];
  const wellness={get canPresent(){return focused && !props.blocked;},ready:true,state:{alerts:[alert],reminders},now:Date.now(),requestedSignature:null,error:null,
    hasPresented:s=>presented.has(s),markPresented:s=>presented.add(s),claimPresentation:async s=>{if(presented.has(s))return false;presented.add(s);return true;},consumeRequest(){},acknowledge:async()=>{},saveReminder:async()=>""};
  const props={global:true,date:new Date(),catId:null,blocked,onOpenContext(){}};
  const create=()=>mount("components/wellness/WellnessCalendarSection.tsx",{props,context:()=>({state:{cats:[cat]}}),
    dependencies:{"@/context/WellnessContext":{useWellness:()=>wellness},"@react-navigation/native":{useIsFocused:()=>focused},
      "react-native":{AppState:{currentState:"active"},StyleSheet:{create:s=>s},View:"View",Text:"Text",TouchableOpacity:"TouchableOpacity"}}});
  const screen=create();screen.render();assert.equal(find(screen.render(),"./WellnessCheckInModal"),undefined);
  props.blocked=false;screen.render();await new Promise(setImmediate);
  const modal=find(screen.render(),"./WellnessCheckInModal");assert.ok(modal);modal.props.onClose();
  assert.equal(find(screen.render(),"./WellnessCheckInModal"),undefined);
  const remount=create();remount.render();assert.equal(find(remount.render(),"./WellnessCheckInModal"),undefined);
  presented.clear();remount.render();await new Promise(setImmediate);assert.ok(find(remount.render(),"./WellnessCheckInModal"));
  focused=false;assert.equal(find(remount.render(),"./WellnessCheckInModal"),undefined);
});
test("notification opens the same reminder globally without navigating to Calendar",()=>{
  let target=null,consumed=0;
  const wellness={canPresent:true,ready:true,state:{alerts:[alert],reminders:[{id:"rem",alertSignature:"pattern",catId:"cat",scheduledAt:"2026-10-25T08:00:00Z",status:"scheduled"}]},
    now:Date.now(),requestedSignature:"pattern",hasPresented:()=>true,markPresented(){},consumeRequest(){consumed++;this.requestedSignature=null;}};
  const screen=mount("components/wellness/WellnessCalendarSection.tsx",{props:{global:true,date:new Date(),catId:null,blocked:false,onOpenContext:(date,id)=>target=[date,id]},
    context:()=>({state:{cats:[cat]}}),dependencies:{"@/context/WellnessContext":{useWellness:()=>wellness},"@react-navigation/native":{useIsFocused:()=>true},
      "react-native":{AppState:{currentState:"active"},StyleSheet:{create:s=>s},View:"View",Text:"Text",TouchableOpacity:"TouchableOpacity"}}});
  screen.render();const tree=screen.render();assert.equal(find(tree,"./WellnessReminderDetails"),undefined);assert.equal(find(tree,"./WellnessCheckInModal"),undefined);assert.equal(consumed,1);assert.equal(target,null);
});
test("reminder editor rejects past times, preserves cat header, and confirms deletion",async()=>{
  let saved=0,deleted=0,confirmation;
  const screen=mount("components/wellness/WellnessReminderEditor.tsx",{props:{cat,alert,reminder:{scheduledAt:"2020-01-01T00:00:00Z",status:"scheduled"},onClose(){},onSave:async()=>saved++,onComplete:async()=>{},onDelete:async()=>deleted++},
    dependencies:{"@/constants/theme":theme,"react-native":{Platform:{OS:"android"},StyleSheet:{create:s=>s},Text:"Text",View:"View",TextInput:"TextInput",Alert:{alert:(_t,_m,buttons)=>confirmation=buttons}}}});
  let tree=screen.render();assert.equal(find(tree,"./WellnessCatHeader").props.cat,cat);
  await nodes(tree).find(n=>n.props?.label==="Save changes").props.onPress();assert.equal(saved,0);
  assert.match(nodes(screen.render()).find(n=>n.props?.accessibilityRole==="alert").props.children,/future/);
  nodes(screen.render()).find(n=>n.props?.label==="Delete reminder").props.onPress();assert.equal(deleted,0);
  await find(screen.render(),"/ConfirmModal").props.onConfirm();assert.equal(deleted,1);
});
