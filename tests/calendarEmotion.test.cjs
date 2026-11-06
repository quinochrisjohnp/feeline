const test=require('node:test'),assert=require('node:assert/strict');
require('./helpers/frontendHarness.cjs');
const {dailyEmotion}=require('../utils/calendarEmotion.ts');
const date=new Date(2026,9,21),at=h=>new Date(2026,9,21,h).toISOString();
const record=(id,emotion,h,catId='a')=>({id,emotion,recordedAt:at(h),catId});
test('highest count wins over latest record and input remains untouched',()=>{
 const records=[record('1','happy',1),record('2','happy',2),record('3','angry',23)];
 const before=JSON.stringify(records);assert.equal(dailyEmotion(records,date),'happy');assert.equal(JSON.stringify(records),before);
});
test('ties consider only highest-count emotions and use actual latest timestamp',()=>{
 const records=[record('1','happy',1),record('2','happy',2),record('3','fear',3),record('4','fear',4),record('5','angry',23)];
 assert.equal(dailyEmotion(records,date),'fear');assert.equal(dailyEmotion(records.reverse(),date),'fear');
});
test('local date, unique IDs, valid emotions/timestamps; reminders never count',()=>{
 const a=record('1','neutral',0);const items=[a,a,{...a,id:'bad',recordedAt:'invalid'},{...a,id:'reminder',emotion:undefined},{...a,id:'other',recordedAt:new Date(2026,9,22,0).toISOString()}];
 assert.equal(dailyEmotion(items,date),'neutral');assert.equal(dailyEmotion(items,new Date(2026,9,20)),undefined);
});
test('cat-filtered inputs recompute independently of all-cat counts',()=>{
 const records=[record('1','happy',1),record('2','happy',2),record('3','angry',3,'b')];
 assert.equal(dailyEmotion(records,date),'happy');assert.equal(dailyEmotion(records.filter(r=>r.catId==='b'),date),'angry');
});

test('canonical fear is displayed alone and wins the daily majority',()=>{
 assert.equal(dailyEmotion([record('1','fear',10)],date),'fear');
 assert.equal(dailyEmotion([record('1','fear',10),record('2','fear',11),record('3','happy',16)],date),'fear');
});
test('three angry beats two happy; tied neutral loses to later angry detection',()=>{
 const angry=[record('a1','angry',9),record('a2','angry',10),record('a3','angry',16)];
 assert.equal(dailyEmotion([...angry,record('h1','happy',17),record('h2','happy',18)],date),'angry');
 const tied=[...angry,record('n1','neutral',11),record('n2','neutral',12),record('n3','neutral',13)];
 assert.equal(dailyEmotion(tied,date),'angry');
 assert.equal(dailyEmotion(tied.reverse(),date),'angry');
});
