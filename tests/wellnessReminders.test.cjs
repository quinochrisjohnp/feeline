const test=require("node:test"),assert=require("node:assert/strict");
require("./helpers/frontendHarness.cjs");
const {LocalWellnessReminders}=require("../services/localWellnessReminders.ts");
const {emptyWellnessState}=require("../types/wellness.ts");
const candidate={signature:"a-pattern",catId:"a",rule:"same_day_sequence",detectionIds:["1","2","3"],from:"2026-10-20T08:00:00Z",through:"2026-10-20T10:00:00Z"};
async function setup(allowed=true) {
  let saved=emptyWellnessState();const calls=[];
  const ports={read:async()=>saved,write:async s=>{saved=structuredClone(s);calls.push("write");},
    permission:async request=>{calls.push("permission:"+request);return allowed;},notificationId:async(s,k)=>s+"-"+k,
    schedule:async x=>calls.push({schedule:x}),cancel:async id=>{if(id)calls.push("cancel:"+id);},now:()=>new Date("2026-10-21T00:00:00Z")};
  const repo=new LocalWellnessReminders(ports,()=>{});await repo.load();
  await repo.sync([candidate],[{id:"a",name:"Mimi"}]);return {repo,ports,calls,saved:()=>saved};
}
test("same pattern notifies once without requesting permission; concurrent sync does not duplicate",async()=>{
  const {repo,calls}=await setup();
  await Promise.all([repo.sync([candidate],[{id:"a",name:"Mimi"}]),repo.sync([candidate],[{id:"a",name:"Mimi"}])]);
  assert.equal(repo.state.alerts.length,1);
  assert.equal(calls.filter(x=>x.schedule).length,1);
  assert.equal(calls.includes("permission:true"),false);
  assert.equal(calls.find(x=>x.schedule).schedule.catName,"Mimi");
});
test("future reminder persists, editing cancels old before new, completion and deletion affect only wellness",async()=>{
  const {repo,calls,saved}=await setup();
  await assert.rejects(repo.saveReminder(candidate.signature,"2020-01-01T00:00:00Z","Mimi"),/future/);
  await repo.saveReminder(candidate.signature,"2026-10-22T00:00:00Z","Mimi");
  assert.equal(saved().alerts[0].status,"snoozed");assert.equal(saved().reminders.length,1);
  calls.length=0;
  await repo.saveReminder(candidate.signature,"2026-10-23T00:00:00Z","Mimi");
  assert.ok(calls.indexOf("cancel:a-pattern-reminder") < calls.findIndex(x=>x.schedule));
  assert.equal(repo.state.reminders.length,1);
  await repo.acknowledge(candidate.signature);
  assert.equal(repo.state.alerts[0].status,"acknowledged");assert.equal(repo.state.reminders[0].status,"acknowledged");
  await repo.acknowledge(candidate.signature,true);assert.equal(repo.state.reminders.length,0);
  assert.deepEqual(repo.state.alerts[0].detectionIds,["1","2","3"]);
});
test("permission denial and scheduler failure preserve Calendar reminders",async()=>{
  const {repo,calls}=await setup(false);
  const message=await repo.saveReminder(candidate.signature,"2026-10-22T00:00:00Z","Mimi");
  assert.match(message,/notifications are off/);assert.equal(repo.state.reminders[0].notificationState,"off");
  assert.equal(calls.filter(x=>x.schedule).length,0);
  const failed=await setup();
  failed.ports.schedule=async()=>{throw Error("native scheduling failed");};
  assert.match(await failed.repo.saveReminder(candidate.signature,"2026-10-22T00:00:00Z","Mimi"),/could not be scheduled/);
  assert.equal(failed.repo.state.reminders[0].notificationState,"failed");
});
test("persistence errors are surfaced; acknowledged signature survives restoration",async()=>{
  const {repo,ports}=await setup();await repo.acknowledge(candidate.signature);
  const restored=new LocalWellnessReminders(ports,()=>{});await restored.load();
  await restored.sync([candidate],[{id:"a",name:"Mimi"}]);assert.equal(restored.state.alerts[0].status,"acknowledged");
  ports.write=async()=>{throw Error("disk unavailable");};
  await assert.rejects(restored.saveReminder(candidate.signature,"2026-10-22T00:00:00Z","Mimi"),/disk unavailable/);
});

test("rapid identical reminder saves schedule only one phone reminder",async()=>{
  const {repo,calls}=await setup();calls.length=0;
  await Promise.all([repo.saveReminder(candidate.signature,"2026-10-22T00:00:00Z","Mimi"),repo.saveReminder(candidate.signature,"2026-10-22T00:00:00Z","Mimi")]);
  assert.equal(repo.state.reminders.length,1);
  assert.equal(calls.filter(x=>x.schedule).length,1);
  assert.equal(calls.filter(x=>x==="permission:true").length,1);
});

test("persisted claims serialize races, survive restart and permit only a new due occurrence",async()=>{
 const {repo,ports}=await setup();
 assert.deepEqual(await Promise.all([repo.claimPresentation(candidate.signature),repo.claimPresentation(candidate.signature)]),[true,false]);
 let restored=new LocalWellnessReminders(ports,()=>{});await restored.load();assert.equal(await restored.claimPresentation(candidate.signature),false);
 await restored.saveReminder(candidate.signature,"2026-10-22T00:00:00Z","Mimi");assert.equal(await restored.claimPresentation(candidate.signature),false);
 ports.now=()=>new Date("2026-10-22T01:00:00Z");
 assert.deepEqual(await Promise.all([restored.claimPresentation(candidate.signature),restored.claimPresentation(candidate.signature)]),[true,false]);
 restored=new LocalWellnessReminders(ports,()=>{});await restored.load();assert.equal(await restored.claimPresentation(candidate.signature),false);
 const id=restored.state.reminders[0].id;await restored.saveReminder(candidate.signature,"2026-10-23T00:00:00Z","Mimi");assert.equal(restored.state.reminders.length,1);assert.equal(restored.state.reminders[0].id,id);
 ports.now=()=>new Date("2026-10-23T01:00:00Z");assert.equal(await restored.claimPresentation(candidate.signature),true);
 await restored.acknowledge(candidate.signature);assert.equal(await restored.claimPresentation(candidate.signature),false);
});
test("failed presentation persistence never grants a claim",async()=>{const {repo,ports}=await setup();ports.write=async()=>{throw Error("disk");};await assert.rejects(repo.claimPresentation(candidate.signature),/disk/);assert.equal(repo.state.alerts[0].presentedAt,undefined);});
