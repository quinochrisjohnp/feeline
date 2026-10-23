const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const {mount,nodes,find,modal}=require('./helpers/frontendHarness.cjs');
const load=require('./helpers/loadTsModule.cjs');
const theme=load('constants/theme.ts',{'react-native':{Platform:{OS:'android'}}});
const deps={'@/constants/theme':theme};
const button=(tree,label)=>nodes(tree).find(n=>n.props?.label===label);
const cat={id:'cat',name:'Mimi',gender:'Female',birthdate:'2020-01-01',photoUri:null,coverUri:null};
const initial=()=>({cats:[cat,{...cat,id:'other',name:'Nala'}],albums:[{id:'album',catId:'cat',kind:'cat'},{id:'other-album',catId:'other',kind:'cat'},{id:'unknown-cats',catId:null,kind:'unknown'}],images:[],detectionRecords:[]});

test('icon composition preserves original, opaque 1024 output, cream edges and adaptive safe zone',async()=>{
  const Jimp=require('jimp-compact'),{expo}=require('../app.json');
  assert.equal(expo.icon,'./components/images/logo-only.png');
  assert.equal(expo.android.adaptiveIcon.backgroundColor,'#FFF7E9');
  assert.equal(expo.android.adaptiveIcon.foregroundImage,'./components/images/logo-adaptive-foreground.png');
  for(const p of [expo.ios.icon,expo.android.adaptiveIcon.foregroundImage]){
    const im=await Jimp.read(p);assert.equal(im.bitmap.width,1024);assert.equal(im.bitmap.height,1024);
    for(let i=3;i<im.bitmap.data.length;i+=4)assert.equal(im.bitmap.data[i],255);
    assert.equal(im.getPixelColor(0,0),0xfff7e9ff);
  }
  const im=await Jimp.read(expo.android.adaptiveIcon.foregroundImage);let radius=0;
  im.scan(0,0,1024,1024,function(x,y,i){const d=this.bitmap.data;if(Math.min(d[i],d[i+1],d[i+2])<210)radius=Math.max(radius,Math.hypot(x-512,y-512));});
  assert.ok(radius<1024*66/108/2,'important artwork fits the adaptive safe circle');
  const source=cp.execFileSync('git',['show','HEAD:components/images/logo-only.png'],{maxBuffer:5e6});
  assert.deepEqual(fs.readFileSync('components/images/logo-only.png'),source);
});

test('shared button variants keep compact accessible targets, loading and pressed states',()=>{
  for(const variant of ['primary','secondary','text','danger','icon','outline','google','dangerText']){
    const props={label:'Action',variant,size:'compact',leftIcon:'icon'};
    const render=()=>mount('components/common/Button.tsx',{props,dependencies:deps}).render();
    let tree=render();const styles=Object.assign({},...tree.props.style({pressed:false}).filter(Boolean));
    assert.equal(styles.minHeight,44);assert.equal(styles.borderRadius,12);assert.equal(tree.props.accessibilityLabel,'Action');
    assert.equal(Object.assign({},...tree.props.style({pressed:true}).filter(Boolean)).opacity,0.8);
    props.loading=true;tree=render();assert.equal(tree.props.disabled,true);assert.equal(tree.props.accessibilityState.busy,true);
    assert.ok(find(tree,'ActivityIndicator'));
  }
});

test('album has no management actions and separates Unknown Cats from left-aligned square grid',()=>{
  let state=initial();const routes=[];
  const screen=mount('app/(screens)/(tabs)/album.tsx',{context:()=>({state,refreshDetections:async()=>{}}),router:{push:r=>routes.push(r)},dependencies:deps});
  let tree=screen.render();const grid=nodes(tree).find(n=>n.props?.onLayout);grid.props.onLayout({nativeEvent:{layout:{width:320}}});tree=screen.render();
  const cards=nodes(tree).filter(n=>n.type?.endsWith?.('/CatCoverCard'));
  assert.equal(cards.length,3);assert.ok(cards.every(c=>!c.props.onLongPress));
  assert.equal(cards[0].props.style.width,152);assert.equal(cards[2].props.variant,'bar');
  assert.equal(nodes(tree).find(n=>n.props?.onLayout).props.style.justifyContent,'flex-start');
  assert.equal(find(tree,'/RenameCatModal'),undefined);assert.equal(find(tree,'/ConfirmModal'),undefined);
  cards[2].props.onPress();assert.equal(routes[0].params.albumId,'unknown-cats');
  state={...state,cats:[],albums:[state.albums[2]]};assert.equal(nodes(screen.render()).filter(n=>n.type?.endsWith?.('/CatCoverCard')).length,1);
});

test('profile long press edits through context and deletion refreshes both lists with duplicate guard',async()=>{
  const {catDataReducer}=require('../context/catDataReducer.ts');let state=initial(),updates=[],deletes=0,release;
  const context=()=>({state,addCat:async()=>{},updateCat:async(id,changes)=>{updates.push([id,changes]);state=catDataReducer(state,{type:'UPDATE_CAT',catId:id,changes});},deleteCat:async id=>{deletes++;await new Promise(r=>release=r);state=catDataReducer(state,{type:'DELETE_CAT',catId:id});}});
  const screen=mount('app/(screens)/(tabs)/status.tsx',{context,dependencies:deps});
  const cards=()=>nodes(screen.render()).filter(n=>n.type?.endsWith?.('/CatCoverCard'));
  cards()[0].props.onLongPress();assert.equal(cards()[0].props.selected,true);assert.equal(cards()[1].props.faded,true);
  nodes(screen.render()).find(n=>n.props?.accessibilityLabel==='Edit').props.onPress();
  const form=nodes(screen.render()).find(n=>n.type?.endsWith?.('/AddCatForm')&&n.props.initialCat);
  assert.equal(form.props.visible,true);await form.props.onSave({...cat,name:'New name'});
  assert.equal(updates[0][0],'cat');assert.equal(updates[0][1].name,'New name');
  const album=mount('app/(screens)/(tabs)/album.tsx',{context:()=>({...context(),refreshDetections:async()=>{}}),dependencies:deps});
  assert.equal(find(album.render(),'/CatCoverCard').props.name,'New name');
  modal(screen.render(),'Cat Profile Updated').props.onConfirm();
  cards()[0].props.onPress();assert.equal(nodes(screen.render()).find(n=>n.props?.accessibilityLabel==='Edit Cat Profile'),undefined);
  nodes(screen.render()).find(n=>n.props?.accessibilityLabel==='Back to Cat Profiles').props.onPress();
  cards()[0].props.onLongPress();nodes(screen.render()).find(n=>n.props?.accessibilityLabel==='Delete').props.onPress();
  const confirm=modal(screen.render(),'Delete this cat profile');assert.equal(confirm.props.destructive,true);
  const pending=confirm.props.onConfirm();await confirm.props.onConfirm();assert.equal(deletes,1);release();await pending;
  assert.equal(cards().length,1);assert.equal(nodes(album.render()).filter(n=>n.type?.endsWith?.('/CatCoverCard')).length,2);
});

test('Add/Edit uses full-width stacked fields, focus borders, limits and compact footer',()=>{
  const screen=mount('components/cats/AddCatForm.tsx',{props:{visible:true,initialCat:cat,onCancel(){},onSave(){}},dependencies:deps});screen.render();let tree=screen.render();
  const name=nodes(tree).find(n=>n.props?.accessibilityLabel==='Name');
  assert.equal(name.props.style[0].width,'100%');assert.equal(name.props.style[0].minHeight,44);assert.equal(name.props.style[0].borderRadius,12);
  name.props.onFocus();tree=screen.render();assert.equal(nodes(tree).find(n=>n.props?.accessibilityLabel==='Name').props.style[1].borderColor,theme.colors.focus);
  assert.equal(button(tree,'Save changes').props.size,'compact');assert.equal(button(tree,'Cancel').props.variant,'text');
  const description=nodes(tree).find(n=>n.props?.accessibilityLabel==='Description');assert.equal(description.props.multiline,true);assert.equal(description.props.maxLength,500);
});

test('wellness header has no heart and reminder opens read-only details before the editor',()=>{
  const alert={signature:'pattern',catId:'cat',rule:'same_day_sequence',status:'snoozed',from:'2026-10-19T00:00:00Z',through:'2026-10-20T00:00:00Z'};
  const reminder={id:'r',alertSignature:'pattern',catId:'cat',scheduledAt:'2030-01-01T00:00:00Z',status:'scheduled'};
  const wellness={state:{alerts:[alert],reminders:[reminder]},ready:true,now:0,hasPresented:()=>true,markPresented(){},consumeRequest(){},acknowledge:async()=>{}};
  const screen=mount('components/wellness/WellnessCalendarSection.tsx',{props:{date:new Date(reminder.scheduledAt),catId:null,blocked:false,onOpenContext(){}},context:()=>({state:initial()}),dependencies:{...deps,'@/context/WellnessContext':{useWellness:()=>wellness},'@react-navigation/native':{useIsFocused:()=>true},'react-native':{AppState:{currentState:'active'},StyleSheet:{create:s=>s},View:'View',Text:'Text',TouchableOpacity:'TouchableOpacity'}}});
  nodes(screen.render()).find(n=>n.props?.accessibilityLabel==='View check-in reminder for Mimi').props.onPress();
  let tree=screen.render();assert.equal(find(tree,'./WellnessReminderEditor'),undefined);
  const details=find(tree,'./WellnessReminderDetails');assert.ok(details);details.props.onEdit();assert.ok(find(screen.render(),'./WellnessReminderEditor'));
  const header=mount('components/wellness/WellnessCatHeader.tsx',{props:{cat},dependencies:deps}).render();assert.equal(find(header,'Icon'),undefined);
  let edited=0;const detailTree=mount('components/wellness/WellnessReminderDetails.tsx',{props:{cat,alert,reminder,onClose(){},onEdit(){edited++;}},dependencies:deps}).render();
  assert.equal(find(detailTree,'TextInput'),undefined);assert.equal(button(detailTree,'Okay, I’ll check'),undefined);assert.equal(button(detailTree,'Remind me later'),undefined);find(detailTree,'/ModalHeader').props.onEdit();assert.equal(edited,1);
  const editor=mount('components/wellness/WellnessReminderEditor.tsx',{props:{cat,alert,reminder},dependencies:deps}).render();
  assert.equal(button(editor,'Mark completed'),undefined);assert.equal(button(editor,'Remind me later'),undefined);assert.ok(button(editor,'Save changes'));
});

test('tips preference persists, synchronizes subscribers and handles storage failure without losing saved choice',async()=>{
  let stored=null,failed=false,events=0;
  const dependencies={'expo-secure-store':{getItemAsync:async()=>stored,setItemAsync:async(_k,v)=>{if(failed)throw Error();stored=v;}},'react-native':{Platform:{OS:'android'}}};
  const store=load('services/cameraTipsPreference.ts',dependencies);const remove=store.subscribeCameraTipsPreference(()=>events++);
  await store.loadCameraTipsPreference();assert.equal(store.getCameraTipsPreference().enabled,true);
  await store.setCameraTipsPreference(false);assert.equal(stored,'false');assert.equal(store.getCameraTipsPreference().enabled,false);
  const restored=load('services/cameraTipsPreference.ts',dependencies);await restored.loadCameraTipsPreference();assert.equal(restored.getCameraTipsPreference().enabled,false);
  failed=true;await store.setCameraTipsPreference(true);assert.equal(store.getCameraTipsPreference().enabled,false);assert.ok(store.getCameraTipsPreference().error);assert.ok(events>=5);remove();
});

test('Only tips checkbox controls the preference, and avatar clips to a circle',()=>{
  const preference={enabled:true,ready:true,saving:false,error:null,setEnabled:async v=>{preference.enabled=v;}};
  const dependencies={...deps,'@/hooks/useCameraTipsPreference':{useCameraTipsPreference:()=>preference},'@/context/AuthContext':{useAuth:()=>({profile:{profileImageUrl:'https://example.com/me.jpg'},signOut:async()=>{}})}};
  const settings=mount('app/(screens)/(tabs)/settings.tsx',{dependencies});let tree=settings.render();const avatar=find(tree,'Image');assert.equal(avatar.props.style.borderRadius,avatar.props.style.width/2);assert.equal(avatar.props.resizeMode,'cover');
  assert.equal(nodes(tree).find(n=>n.props?.accessibilityLabel==='Show camera tips automatically'),undefined);
  const assets=Object.fromEntries(['cat_blurred.png','cat_dark.png','dog.png','cat_cropped.png','cat_deformaties.png'].map(n=>['../images/'+n,n]));
  const tips=mount('components/camera/WhatToAvoidModal.tsx',{props:{visible:true,onClose(){}},dependencies:{...dependencies,...assets}});
  let checkbox=nodes(tips.render()).find(n=>n.props?.accessibilityRole==='checkbox');assert.equal(checkbox.props.accessibilityState.checked,false);checkbox.props.onPress();
  assert.equal(preference.enabled,false);
});

test('document text is unchanged and readable surfaces wrap legal/about content',()=>{
  const ts=require('typescript');function content(source){const f=ts.createSourceFile('x.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),out=[];function walk(n){if(ts.isJsxText(n)&&n.text.trim())out.push(n.text.replace(/\s+/g,' ').trim());if(ts.isStringLiteral(n)&&n.parent&&ts.isPropertyAssignment(n.parent)&&['title','body'].includes(n.parent.name.getText(f)))out.push(n.text);ts.forEachChild(n,walk);}walk(f);return out;}
  for(const file of ['app/(screens)/settings-about.tsx','app/(screens)/settings-privacy.tsx','app/(screens)/settings-terms.tsx']){
    assert.deepEqual(content(fs.readFileSync(file,'utf8')),content(cp.execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'})));
  }
  assert.ok(find(mount('app/(screens)/settings-about.tsx').render(),'/DocumentSurface'));
});

test('Calendar reuses Album viewer with contained image, emotion, download and origin-aware Back',()=>{
  const state=initial();state.detectionRecords=[{id:'d',imageId:'i',catId:'cat',imageUri:'https://example.com/photo.jpg',emotion:'happy',confidence:90,recordedAt:'2026-10-21T12:00:00Z'}];
  for(const from of ['calendar','album']) {
    state.images=[{id:'i',albumId:'album',imageUri:state.detectionRecords[0].imageUri,capturedAt:state.detectionRecords[0].recordedAt}];
    let destination; const screen=mount('app/(screens)/album-photo.tsx',{params:{imageId:'i',from},router:{dismissTo:r=>destination=r},context:()=>({state}),dependencies:deps});
    let tree=screen.render();nodes(tree).find(n=>n.props?.onLayout).props.onLayout({nativeEvent:{layout:{width:300,height:500}}});tree=screen.render();
    assert.equal(find(tree,'/MockPhoto').props.resizeMode,'contain');assert.equal(find(tree,'/MockPhoto').props.imageUri,state.images[0].imageUri);
    for(const label of ['Emotion','Download','Delete'])assert.ok(nodes(tree).find(n=>n.props?.accessibilityLabel===label));
    nodes(tree).find(n=>n.props?.accessibilityLabel==='Emotion').props.onPress();assert.ok(find(screen.render(),'/EmotionResultCard'));
    find(tree,'/DetailScreenHeader').props.onBack();assert.equal(from==='calendar'?destination:destination.pathname,from==='calendar'?'/calendar':'/album-folder');
  }
});

test('Calendar saved photo deletion is guarded and retains history through the existing reducer',async()=>{
 const {catDataReducer}=require('../context/catDataReducer.ts');let state=initial(),calls=0,release;
 state.images=[{id:'i',albumId:'album',imageUri:'file:///cat.jpg',capturedAt:'2026-10-21T00:00:00Z'}];
 state.detectionRecords=[{id:'d',imageId:'i',catId:'cat',imageUri:'file:///cat.jpg',emotion:'happy',recordedAt:'2026-10-21T00:00:00Z',isSavedToAlbum:true}];
 const screen=mount('app/(screens)/album-photo.tsx',{params:{imageId:'i',from:'calendar'},dependencies:deps,context:()=>({state,deleteImage:async id=>{calls++;await new Promise(r=>release=r);state=catDataReducer(state,{type:'DELETE_IMAGE',imageId:id});}})});
 nodes(screen.render()).find(n=>n.props?.accessibilityLabel==='Delete').props.onPress();
 const confirm=modal(screen.render(),'Remove this Photo');const pending=confirm.props.onConfirm();await confirm.props.onConfirm();assert.equal(calls,1);release();await pending;
 assert.equal(state.images.length,0);assert.equal(state.detectionRecords.length,1);assert.equal(state.detectionRecords[0].isSavedToAlbum,false);assert.ok(modal(screen.render(),'Removed from Album'));
});
test('Camera error modal uses shared shell, clears on retry and retains settings access',()=>{
 let closed=0,tips=0,settings=0;const tree=mount('components/camera/CameraErrorModal.tsx',{dependencies:deps,props:{notice:{title:'Detection unavailable',message:'Try again',photoTips:false},onClose:()=>closed++,onPhotoTips:()=>tips++,onSettings:()=>settings++}}).render();
 assert.ok(find(tree,'/ModalSurface'));assert.equal(nodes(tree).find(n=>n.props?.accessibilityRole==='header').props.children,'Detection unavailable');assert.equal(find(tree,'/ModalHeader'),undefined);assert.equal(find(tree,'Icon'),undefined);assert.equal(button(tree,'Close'),undefined);
 button(tree,'Try another photo').props.onPress();button(tree,'View photo tips').props.onPress();button(tree,'Open Settings').props.onPress();assert.deepEqual([closed,tips,settings],[1,1,1]);
});
