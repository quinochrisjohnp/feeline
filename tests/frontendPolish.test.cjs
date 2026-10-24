const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {mount,nodes,find,store}=require('./helpers/frontendHarness.cjs');
const {PNG}=require('pngjs');
const theme=require('./helpers/loadTsModule.cjs')('constants/theme.ts',{'react-native':{Platform:{OS:'android'}}});
const button=(tree,label)=>nodes(tree).find(n=>n.props?.label===label);

test('shared dialog actions stay horizontal and balanced at narrow and tall phone widths',()=>{
 for(const width of [320,390,430]){
  let first=0,second=0;
  const tree=mount('components/common/DialogActions.tsx',{props:{first:{label:'Try another photo',onPress:()=>first++},second:{label:'View photo tips',onPress:()=>second++}},dependencies:{'@/constants/theme':theme,'react-native':{StyleSheet:{create:s=>s},View:'View',useWindowDimensions:()=>({width})}}}).render();
  assert.equal(Object.assign({},...tree.props.style.filter(Boolean)).flexDirection,'row');assert.equal(Object.assign({},...tree.props.style.filter(Boolean)).alignItems,'stretch');
  for(const n of nodes(tree).filter(n=>n.props?.label)){assert.equal(n.props.size,'compact');assert.equal(n.props.style[0].flex,1);assert.equal(n.props.style[0].minHeight,44);assert.ok(n.props.labelStyle.fontSize>=12);n.props.onPress();}
  assert.equal(first,1);assert.equal(second,1);
 }
});

test('save confirmation uses outlined Cancel and preserved busy/confirm handlers',()=>{
 let saves=0,cancels=0;
 const tree=mount('components/common/ConfirmModal.tsx',{props:{visible:true,balanced:true,title:'Save image in Mimi?',message:'Save this photo.',confirmLabel:'Save',busy:true,onConfirm:()=>saves++,onCancel:()=>cancels++}}).render();
 assert.equal(button(tree,'Cancel').props.variant,'outline');assert.equal(button(tree,'Cancel').props.disabled,true);
 assert.equal(button(tree,'Save').props.loading,true);tree.props.onClose();assert.equal(cancels,0);
 button(tree,'Save').props.onPress();assert.equal(saves,1);
});

test('notification glyph is 96px white with transparent margins, and native splash contains no logo',()=>{
 const config=require('../app.json').expo;
 const notification=config.plugins.find(p=>p[0]==='expo-notifications')[1];
 assert.equal(notification.color,theme.colors.textPrimary);
 const image=PNG.sync.read(fs.readFileSync(notification.icon));assert.equal(image.width,96);assert.equal(image.height,96);
 let opaque=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++){
  const i=(y*96+x)*4,a=image.data[i+3];assert.ok(a===0||a===255);
  if(a){opaque++;assert.deepEqual([...image.data.slice(i,i+3)],[255,255,255]);assert.ok(x>=8&&x<88&&y>=8&&y<88);}
 }
 assert.ok(opaque>500&&opaque<4000,'recognizable glyph, not a filled square');
 const splash=config.plugins.find(p=>p[0]==='expo-splash-screen')[1];
 const blank=PNG.sync.read(fs.readFileSync(splash.image));
 for(let i=3;i<blank.data.length;i+=4)assert.equal(blank.data[i],0);
 assert.equal(splash.backgroundColor,'#FFF7E9');assert.equal(splash.dark.image,splash.image);
});

test('empty gallery uses remaining flex area without an empty scrolling grid',()=>{
 const data=store({emptyHistory:true});const album=data().state.albums[0];
 const tree=mount('app/(screens)/album-folder.tsx',{params:{albumId:album.id},context:data}).render();
 const empty=nodes(tree).find(n=>n.props?.title==='No photos yet');assert.ok(empty);
 const parent=nodes(tree).find(n=>n.props?.children?.props?.title==='No photos yet');
 assert.equal(parent.props.style.flex,1);assert.equal(parent.props.style.justifyContent,'center');assert.equal(parent.props.style.alignItems,'center');assert.equal(find(tree,'ScrollView'),undefined);
});

test('Calendar native picker starts at selected local date and updates month/day while retaining filter',()=>{
 let picker;const data=store();
 const screen=mount('app/(screens)/(tabs)/calendar.tsx',{context:data,dependencies:{'@react-native-community/datetimepicker':{DateTimePickerAndroid:{open:options=>picker=options}}}});
 let tree=screen.render();const filter=find(tree,'/CatFilterModal');const choice=filter.props.options.find(o=>o.id!==null);filter.props.onSelect(choice.id);
 find(screen.render(),'/CalendarHeader').props.onChooseDate();assert.ok(Number.isFinite(picker.value.getTime()));
 const selected=new Date(2027,1,19,12);picker.onChange({type:'set'},selected);
 tree=screen.render();assert.match(find(tree,'/CalendarHeader').props.label,/February 2027/);
 assert.equal(find(tree,'/CatFilterModal').props.selectedCatId,choice.id);
 assert.equal(find(tree,'/WellnessCalendarSection').props.date.getDate(),19);
 const header=mount('components/calendar/CalendarHeader.tsx',{props:{label:'February 2027',onChooseDate(){}}}).render();
 const trigger=nodes(header).find(n=>n.props?.accessibilityLabel==='Choose calendar date, February 2027');assert.equal(trigger.props.accessibilityRole,'button');assert.equal(trigger.props.style.minHeight,44);
});

test('Add/Edit form removes duplicate close, enlarges contained pictures, and preserves Cancel',()=>{
 const cat={id:'cat',name:'Mimi',birthdate:'2020-01-01',gender:'Female',photoUri:'file:///avatar.jpg',coverUri:'file:///cover.jpg'};
 const screen=mount('components/cats/AddCatForm.tsx',{props:{visible:true,initialCat:cat,onCancel(){},onSave(){}}});screen.render();const tree=screen.render();
 assert.equal(button(tree,'Close cat form'),undefined);assert.equal(button(tree,'Cancel').props.variant,'outline');
 const photo=nodes(tree).find(n=>n.props?.accessibilityLabel==='Profile photo');assert.equal(photo.props.resizeMode,'cover');
 const avatar=nodes(tree).find(n=>n.props?.style?.width>0&&n.props?.style?.overflow==='hidden' );assert.equal(avatar.props.style.borderRadius,avatar.props.style.width/2);
});

function globalHost(){
 const cats=[{id:'a',name:'Mimi'},{id:'b',name:'Momo'}];
 const make=(id,catId)=>({signature:id,catId,rule:'same_day_sequence',status:'snoozed',from:'2026-01-01T00:00:00Z',through:'2026-01-02T00:00:00Z'});
 const state={alerts:[make('one','a'),make('two','b')],reminders:[{id:'r1',alertSignature:'one',catId:'a',scheduledAt:'2026-01-03T00:00:00Z',status:'scheduled'},{id:'r2',alertSignature:'two',catId:'b',scheduledAt:'2026-01-04T00:00:00Z',status:'scheduled'}]};
 const presented=new Set();let path='/camera';
 const wellness={state,canPresent:false,ready:true,now:Date.parse('2026-01-05T00:00:00Z'),requestedSignature:null,hasPresented:s=>presented.has(s),markPresented:s=>presented.add(s),claimPresentation:async s=>{if(presented.has(s))return false;presented.add(s);return true;},consumeRequest(){this.requestedSignature=null;},acknowledge:async()=>{},saveReminder:async()=>''};
 const screen=mount('components/wellness/WellnessCalendarSection.tsx',{props:{global:true,date:new Date(),catId:null,blocked:false},context:()=>({state:{cats}}),dependencies:{'@/context/WellnessContext':{useWellness:()=>({...wellness,consumeRequest:()=>{wellness.requestedSignature=null;}})},'expo-router':{usePathname:()=>path},'react-native':{AppState:{currentState:'active'},StyleSheet:{create:s=>s},View:'View',Text:'Text',TouchableOpacity:'TouchableOpacity'}}});
 return {screen,wellness,presented,setPath:p=>path=p};
}

test('global reminders queue across every authenticated module and resume after critical UI without duplication',async()=>{
 for(const path of ['/camera','/album','/album-folder','/album-photo','/status','/calendar','/settings','/settings-about','/settings-feedback']){
  const h=globalHost();h.setPath(path);h.screen.render();assert.equal(find(h.screen.render(),'./WellnessReminderDetails'),undefined);
  h.wellness.canPresent=true;h.screen.render();await new Promise(setImmediate);let first=find(h.screen.render(),'./WellnessReminderDetails');assert.equal(first.props.reminder.id,'r1');
  h.wellness.canPresent=false;assert.equal(find(h.screen.render(),'./WellnessReminderDetails'),undefined);
  h.wellness.requestedSignature='one';h.screen.render();h.wellness.canPresent=true;
  first=find(h.screen.render(),'./WellnessReminderDetails');assert.equal(first.props.reminder.id,'r1');assert.equal(h.wellness.requestedSignature,null);
  first.props.onClose();h.screen.render();await new Promise(setImmediate);const next=find(h.screen.render(),'./WellnessReminderDetails');assert.equal(next.props.reminder.id,'r2');
  next.props.onClose();h.screen.render();assert.equal(find(h.screen.render(),'./WellnessReminderDetails'),undefined);
  h.screen.unmount();assert.equal(h.presented.size,2);
 }
});

test('global reminder respects future times and discards removed cats without losing remaining due items',async()=>{
 const h=globalHost();h.wellness.canPresent=true;h.wellness.now=Date.parse('2026-01-02T00:00:00Z');h.screen.render();assert.equal(find(h.screen.render(),'./WellnessReminderDetails'),undefined);
 h.wellness.now=Date.parse('2026-01-05T00:00:00Z');h.screen.render();await new Promise(setImmediate);assert.ok(find(h.screen.render(),'./WellnessReminderDetails'));
 h.wellness.state.alerts.shift();h.screen.render();h.screen.render();await new Promise(setImmediate);assert.equal(find(h.screen.render(),'./WellnessReminderDetails').props.reminder.id,'r2');
});

test('account provider queues/deduplicates notification responses, defers until data/screen ready, and retains presentation across AppState',async()=>{
 let path='/camera',appChange,tick,response,loaded=false;const data={state:{cats:[],albums:[],images:[],detectionRecords:[]},catsLoading:true,detectionsLoading:false};
 const native={AppState:{currentState:'active',addEventListener:(_,f)=>{appChange=f;return{remove(){}}}}};
 class Repo{constructor(_ports,changed){this.changed=changed;}async load(){loaded=true;this.changed({version:1,alerts:[],reminders:[]});}async sync(){}dispose(){}async saveReminder(){return 'Saved';}}
 const screen=mount('context/WellnessContext.tsx',{componentName:'AccountWellness',props:{owner:'account'},globals:{setInterval:f=>{tick=f;return 1;},clearInterval(){}},dependencies:{
  './AuthContext':{useAuth:()=>({profile:{id:'account'}})},'./CatDataContext':{useCatData:()=>data},
  './PresentationContext':{usePresentationBlocked:()=>false},'@react-navigation/native':{useIsFocused:()=>true},'expo-router':{usePathname:()=>path},'react-native':native,
  '@/services/localWellnessReminders':{LocalWellnessReminders:Repo},'@/services/wellnessStorage':{wellnessAccountKey:async()=> 'key',createWellnessStorage:()=>({})},
  '@/services/localNotifications':{subscribeToWellnessResponses:fn=>{response=fn;return()=>{};}},
 }});
 screen.render();await new Promise(setImmediate);assert.equal(loaded,true);let value=screen.render().props.value;
 value.setCameraSafe(true);assert.equal(screen.render().props.value.canPresent,false,'wait for cats before consuming cold-start notifications');data.catsLoading=false;value=screen.render().props.value;assert.equal(value.canPresent,true);
 response('wrong-owner','bad');response('key','one');response('key','one');response('key','two');value=screen.render().props.value;assert.equal(value.requestedSignature,'one');value.consumeRequest();value=screen.render().props.value;assert.equal(value.requestedSignature,'two');value.consumeRequest();assert.equal(screen.render().props.value.requestedSignature,null);
 value.markPresented('one');appChange('background');assert.equal(screen.render().props.value.canPresent,false);appChange('active');tick();value=screen.render().props.value;assert.equal(value.hasPresented('one'),true);assert.equal(value.canPresent,true);
 response('key','one');assert.equal(screen.render().props.value.requestedSignature,'one','an explicit notification tap can reopen the same dismissed reminder');screen.render().props.value.consumeRequest();
 path='/settings-about';assert.equal(screen.render().props.value.canPresent,false);value.setScreenSafe(path,true);assert.equal(screen.render().props.value.canPresent,true);
 await value.saveReminder('one','2030-01-01T00:00:00Z','Mimi');assert.equal(screen.render().props.value.hasPresented('one'),false,'rescheduled reminder may present at its new due time');screen.unmount();
});

test('presentation blocker counts overlapping dialogs and cleans up idempotently',()=>{
 const screen=mount('context/PresentationContext.tsx',{componentName:'PresentationProvider'});
 let value=screen.render().props.value;assert.equal(value.blocked,false);
 const closeA=value.register(),closeB=value.register();assert.equal(screen.render().props.value.blocked,true);
 closeA();closeA();assert.equal(screen.render().props.value.blocked,true);
 closeB();assert.equal(screen.render().props.value.blocked,false);screen.unmount();
});

test('startup owns one complete logo sequence across font/auth readiness and later auth changes',()=>{
 let authLoading=true,hidden=0,blocked;const props={fontsReady:false};
 const screen=mount('app/_layout.tsx',{componentName:'Startup',props,dependencies:{
  '@/context/AuthContext':{useAuth:()=>({isLoading:authLoading}),AuthProvider:'AuthProvider'},
  '../context/CatDataContext':{CatDataProvider:'CatDataProvider'},
  '@/context/WellnessContext':{WellnessProvider:'WellnessProvider'},
  '@/context/PresentationContext':{usePresentationBlock:v=>blocked=v,PresentationProvider:'PresentationProvider'},
  'expo-splash-screen':{preventAutoHideAsync:async()=>{},hideAsync:async()=>hidden++},
  'expo-status-bar':{StatusBar:'StatusBar'},'expo-font':{useFonts:()=>[true]},
  '@expo-google-fonts/comfortaa':{},'@expo-google-fonts/poppins':{},
 }});
 let tree=screen.render();assert.equal(find(tree,'/BrandedSplash').props.ready,false);assert.equal(blocked,true);tree.props.onLayout();assert.equal(hidden,1);
 props.fontsReady=true;tree=screen.render();assert.equal(find(tree,'/BrandedSplash').props.ready,false);
 authLoading=false;tree=screen.render();assert.equal(find(tree,'/BrandedSplash').props.ready,true);assert.ok(find(tree,'CatDataProvider'),'navigation starts without waiting for fade');
 find(tree,'/BrandedSplash').props.onComplete();tree=screen.render();assert.equal(find(tree,'/BrandedSplash'),undefined);assert.equal(blocked,false);
 authLoading=true;assert.equal(find(screen.render(),'/BrandedSplash'),undefined);authLoading=false;assert.equal(find(screen.render(),'/BrandedSplash'),undefined);
});
