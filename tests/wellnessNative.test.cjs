const test=require("node:test"),assert=require("node:assert/strict"),crypto=require("node:crypto");
require("./helpers/frontendHarness.cjs");
const load=require("./helpers/loadTsModule.cjs");
const cryptoMock={CryptoDigestAlgorithm:{SHA256:"sha256"},digestStringAsync:async(_,s)=>crypto.createHash("sha256").update(s).digest("hex"),randomUUID:crypto.randomUUID};
test("chunked SecureStore snapshots round-trip Unicode and failed writes preserve the old revision",async()=>{
  const {createWellnessStorage,wellnessAccountKey}=load("services/wellnessStorage.ts",{"expo-secure-store":{},"expo-crypto":cryptoMock,"react-native":{Platform:{OS:"android"}}});
  const values=new Map();let fail=false;
  const adapter={get:async k=>values.get(k)??null,set:async(k,v)=>{assert.ok(Buffer.byteLength(v,"utf8")<2048);if(fail&&!k.endsWith("manifest"))throw Error("write failed");values.set(k,v);},remove:async k=>values.delete(k)};
  const a=await wellnessAccountKey("account-a"),b=await wellnessAccountKey("account-b");assert.notEqual(a,b);
  const store=createWellnessStorage(a,adapter),other=createWellnessStorage(b,adapter);
  const data={version:1,alerts:[{signature:"😺".repeat(1000),catId:"cat",detectionIds:["1","2","3"],status:"acknowledged"}],reminders:[]};
  await store.write(data);assert.deepEqual(JSON.parse(JSON.stringify(await store.read())),data);
  assert.equal((await other.read()).alerts.length,0);
  fail=true;await assert.rejects(store.write({...data,alerts:[]}),/write failed/);
  assert.deepEqual(JSON.parse(JSON.stringify(await store.read())),data);
});
function notifications(permission={status:"granted",granted:true,canAskAgain:true}) {
  let listener,last=null;const scheduled=[],calls=[];
  const api={AndroidImportance:{DEFAULT:3},IosAuthorizationStatus:{PROVISIONAL:3},SchedulableTriggerInputTypes:{DATE:"date"},
    setNotificationHandler:x=>calls.push(["handler",x]),setNotificationChannelAsync:async()=>{},
    getPermissionsAsync:async()=>permission,requestPermissionsAsync:async()=>{calls.push(["request"]);return {granted:false,status:"denied"};},
    getAllScheduledNotificationsAsync:async()=>scheduled,scheduleNotificationAsync:async x=>{scheduled.push({identifier:x.identifier});calls.push(["schedule",x]);return x.identifier;},
    cancelScheduledNotificationAsync:async id=>calls.push(["cancel",id]),dismissNotificationAsync:async()=>{},
    addNotificationResponseReceivedListener:fn=>{listener=fn;return {remove:()=>calls.push(["remove"])};},
    getLastNotificationResponseAsync:async()=>last,clearLastNotificationResponseAsync:async()=>calls.push(["clear"])};
  const service=load("services/localNotifications.ts",{"expo-notifications":api,"expo-crypto":cryptoMock,"react-native":{Platform:{OS:"android"}}});
  return {service,calls,setLast:x=>last=x,respond:x=>listener(x)};
}
test("notification permissions are contextual, denied choices are not reprompted, and copy stays non-medical",async()=>{
  const n=notifications({status:"undetermined",granted:false,canAskAgain:true});
  assert.equal(await n.service.notificationPermission(false),false);assert.equal(n.calls.filter(x=>x[0]==="request").length,0);
  await n.service.notificationPermission(true);assert.equal(n.calls.filter(x=>x[0]==="request").length,1);
  const denied=notifications({status:"denied",granted:false,canAskAgain:true});
  await denied.service.notificationPermission(true);assert.equal(denied.calls.filter(x=>x[0]==="request").length,0);
  const copy=n.service.wellnessNotificationCopy("Mimi");assert.match(copy.title,/Mimi/);assert.doesNotMatch(copy.body,/illness|pain|medical|sick|diagnos/i);
});
test("scheduling checks existing identifier and response opens correct context once, including cold start",async()=>{
  const n=notifications(),opened=[];
  const input={id:"id",owner:"owner",signature:"pattern",catName:"Mimi",at:"2026-10-25T08:00:00Z"};
  await n.service.scheduleWellnessNotification(input);await n.service.scheduleWellnessNotification(input);
  assert.equal(n.calls.filter(x=>x[0]==="schedule").length,1);
  const request=n.calls.find(x=>x[0]==="schedule")[1];
  assert.equal(request.trigger.type,"date");assert.equal(request.content.data.signature,"pattern");
  const response={notification:{date:1,request:{identifier:"id",content:{data:{type:"feeline-wellness",owner:"owner",signature:"pattern"}}}}};
  n.setLast(response);const cleanup=n.service.subscribeToWellnessResponses((...args)=>opened.push(args));
  await Promise.resolve();n.respond(response);assert.deepEqual(opened,[["owner","pattern"]]);
  n.respond({...response,notification:{...response.notification,date:2}});assert.equal(opened.length,2,"edited reminder can fire later with same identifier");
  cleanup();n.respond({...response,notification:{...response.notification,date:3}});assert.equal(opened.length,2);
});
