const test=require('node:test');
const assert=require('node:assert/strict');
const {mount,nodes,find,modal,store}=require('./helpers/frontendHarness.cjs');
const tick=()=>new Promise(setImmediate);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};

test('API provider loads cats/history, hides temporary Unknown cats, and renames the shared profile',async()=>{
 const fixture=require('./helpers/domainFixture.cjs').createState();let cats=structuredClone(fixture.cats),removed=[];
 const auth={profile:{id:'test-user'}};
 const provider=mount('context/CatDataContext.tsx',{dependencies:{
  '@/context/AuthContext':{useAuth:()=>auth},
  '@/services/cats':{fetchCats:async()=>[...cats,{...cats[0],id:'temporary',name:'Unknown Cats'}],
   createCat:async c=>{cats.push(c);return c;},updateCat:async(id,changes)=>{const c=cats.find(c=>c.id===id);Object.assign(c,changes);return c;},deleteCat:async id=>{cats=cats.filter(c=>c.id!==id);}},
  '@/services/detection':{fetchDetectionHistory:async()=>({images:fixture.images,detectionRecords:fixture.detectionRecords}),removeDetectionFromAlbum:async id=>removed.push(id)}
 }});
 const value=()=>provider.render().props.value;
 value();await tick();let state=value().state;
 assert.equal(state.cats.length,4);assert.equal(state.albums.length,5);assert.equal(state.albums.filter(a=>a.kind==='unknown').length,1);assert.equal(state.images.length,12);
 await value().renameAlbum(state.albums[0].id,'Updated profile');assert.equal(value().state.cats[0].name,'Updated profile');
 const before=value().state;await value().renameAlbum('unknown-cats','Forbidden');assert.equal(value().state,before);
 const created={...cats[0],id:'new-cat',name:'New cat'};await value().addCat(created);state=value().state;assert.equal(state.albums.filter(a=>a.catId===created.id).length,1);
 await value().deleteImage(state.images[0].id);state=value().state;assert.equal(removed.length,1);assert.equal(state.images.length,11);assert.equal(state.detectionRecords.length,12);assert.equal(state.detectionRecords.find(d=>d.id===removed[0]).isSavedToAlbum,false);
 await value().deleteCat(created.id);assert.equal(value().state.cats.some(c=>c.id===created.id),false);assert.equal(value().state.albums.some(a=>a.catId===created.id),false);
 auth.profile=null;value();await tick();state=value().state;assert.equal(state.cats.length,0);assert.equal(state.images.length,0);assert.equal(state.detectionRecords.length,0);assert.equal(state.albums.length,1);
 provider.unmount();
});

test('batch removal waits for API, blocks duplicate taps/cancellation, and retries failure without false success',async()=>{
 const context=store(),albumId=context().state.albums[0].id;let pending=deferred(),calls=0;
 const screen=mount('app/(screens)/album-folder.tsx',{params:{albumId},context:()=>({...context(),deleteImages:async ids=>{calls++;await pending.promise;context().deleteImages(ids);}}),router:{dismissTo(){}}});
 for(const n of nodes(screen.render()))n.props?.onLayout?.({nativeEvent:{layout:{width:360,height:500}}});
 nodes(screen.render()).find(n=>n.props?.onLongPress).props.onLongPress();
 nodes(screen.render()).find(n=>n.props?.accessibilityLabel==='Delete').props.onPress();
 const first=modal(screen.render(),'Delete these Photos?').props.onConfirm();await modal(screen.render(),'Delete these Photos?').props.onConfirm();
 assert.equal(calls,1);assert.equal(modal(screen.render(),'Images Deleted').props.visible,false);assert.equal(modal(screen.render(),'Delete these Photos?').props.busy,true);
 modal(screen.render(),'Delete these Photos?').props.onCancel();assert.equal(modal(screen.render(),'Delete these Photos?').props.visible,true);
 const before=context().state;pending.reject(Error('API unavailable'));await first;assert.equal(context().state,before);assert.equal(modal(screen.render(),'Images Deleted').props.visible,false);assert.match(modal(screen.render(),'Delete these Photos?').props.message,/try again/);
 pending=deferred();const retry=modal(screen.render(),'Delete these Photos?').props.onConfirm();pending.resolve();await retry;assert.equal(calls,2);assert.equal(modal(screen.render(),'Images Deleted').props.visible,true);assert.equal(context().state.images.length,before.images.length-1);assert.equal(context().state.detectionRecords.length,before.detectionRecords.length);
});
