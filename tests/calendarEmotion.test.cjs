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
 const records=[record('1','happy',1),record('2','happy',2),record('3','fearful',3),record('4','fearful',4),record('5','angry',23)];
 assert.equal(dailyEmotion(records,date),'fearful');assert.equal(dailyEmotion(records.reverse(),date),'fearful');
});
test('local date, unique IDs, valid emotions/timestamps; reminders never count',()=>{
 const a=record('1','neutral',0);const items=[a,a,{...a,id:'bad',recordedAt:'invalid'},{...a,id:'reminder',emotion:undefined},{...a,id:'other',recordedAt:new Date(2026,9,22,0).toISOString()}];
 assert.equal(dailyEmotion(items,date),'neutral');assert.equal(dailyEmotion(items,new Date(2026,9,20)),undefined);
});
test('cat-filtered inputs recompute independently of all-cat counts',()=>{
 const records=[record('1','happy',1),record('2','happy',2),record('3','angry',3,'b')];
 assert.equal(dailyEmotion(records,date),'happy');assert.equal(dailyEmotion(records.filter(r=>r.catId==='b'),date),'angry');
});
