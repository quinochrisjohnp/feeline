const test=require("node:test"),assert=require("node:assert/strict");
const {mount,nodes,find,store}=require("./helpers/frontendHarness.cjs");
const {params}=require("./helpers/predictionFixture.cjs");
test("both Add entry points allow 19 profiles and show the shared limit popup at 20 or more",()=>{
 for(const count of [19,20,21]){
  for(const file of ["app/(screens)/(tabs)/status.tsx","app/(screens)/camera-save.tsx"]){
   const context=store();
   const seed=context().state.cats[0];
   context().state.cats=Array.from({length:count},(_,i)=>({...seed,id:"cat-"+i,name:"Cat "+i}));
   const screen=mount(file,{context,params:params()});
   const label=file.includes("status")?"Add cat":"New Cat Profile";
   const treeBefore=screen.render();
   const add=file.includes("status")?nodes(treeBefore).find(n=>n.props?.accessibilityLabel===label):find(treeBefore,"/DetailScreenHeader").props.rightElement;
   add.props.onPress();
   const tree=screen.render();
   assert.equal(find(tree,"/CatProfileLimitModal").props.visible,count>=20);
   assert.equal(nodes(tree).filter(n=>n.type==="@/components/cats/AddCatForm").at(-1).props.visible,count<20);
   if(count>=20){
    find(tree,"/CatProfileLimitModal").props.onClose();
    assert.equal(find(screen.render(),"/CatProfileLimitModal").props.visible,false);
   }
  }
 }
});
test("limit popup uses the existing confirmation design and states the 20-profile limit",()=>{
 const tree=mount("components/cats/CatProfileLimitModal.tsx",{props:{visible:true,onClose(){}}}).render();
 assert.equal(tree.type,"@/components/common/ConfirmModal");
 assert.match(tree.props.message,/20 cat profiles/);
 assert.equal(tree.props.hideCancel,true);
});
