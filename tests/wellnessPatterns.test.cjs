const test = require("node:test");
const assert = require("node:assert/strict");
require("./helpers/frontendHarness.cjs");
const { detectWellnessPatterns, validDetectionTime, localDayKey } = require("../utils/detectWellnessPatterns.ts");
const { mergeWellnessCandidates, dueWellnessAlerts, remindersForDate } = require("../utils/wellnessState.ts");
const { emptyWellnessState } = require("../types/wellness.ts");
const stamp = (day, hour = 12, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString();
const row = (id, emotion, time, catId = "a") => ({ id, emotion, recordedAt: time, catId, imageId: id, confidence: 90 });
const state = rows => ({ cats: [{ id: "a", name: "Mimi" }, { id: "b", name: "Luna" }], albums: [], images: [], detectionRecords: rows });
test("mixed Angry/Fearful sequence qualifies within 24h, independently of input order, without mutating records", () => {
  const data = state([row("1","angry",stamp(1,8)), row("2","fear",stamp(1,9)), row("3","angry",stamp(2,8))]);
  const before = JSON.stringify(data);
  const result = detectWellnessPatterns(data);
  assert.equal(result.length,1); assert.equal(result[0].rule,"same_day_sequence");
  assert.deepEqual(detectWellnessPatterns(state([...data.detectionRecords].reverse())),result);
  assert.equal(JSON.stringify(data),before);
});
test("happy/neutral breaks a sequence; two, cross-cat, Unknown, and >24h records do not qualify", () => {
  for (const emotion of ["happy","neutral"]) assert.equal(detectWellnessPatterns(state([
    row("1","angry",stamp(1,8)),row("2",emotion,stamp(1,9)),row("3","fear",stamp(1,10)),row("4","angry",stamp(1,11)),
  ])).length,0);
  for (const rows of [
    [row("1","fear",stamp(1)),row("2","angry",stamp(1,13))],
    [row("1","fear",stamp(1)),row("2","angry",stamp(1,13)),row("3","fear",stamp(1,14),"b")],
    [row("1","fear",stamp(1),null),row("2","angry",stamp(1,13),null),row("3","fear",stamp(1,14),null)],
    [row("1","angry",stamp(1,8)),row("2","fear",stamp(1,9)),row("3","angry",stamp(2,9))],
  ]) assert.equal(detectWellnessPatterns(state(rows)).length,0);
});
test("consecutive local days qualify without requiring a sequence; two or skipped days do not", () => {
  const rows = [row("1","angry",stamp(1,8)),row("2","fear",stamp(2,14)),row("3","angry",stamp(3,20))];
  assert.equal(detectWellnessPatterns(state(rows))[0].rule,"consecutive_days");
  assert.equal(detectWellnessPatterns(state(rows.slice(0,2))).length,0);
  rows[2].recordedAt=stamp(4,20);assert.equal(detectWellnessPatterns(state(rows)).length,0);
});
test("similar-time window requires three distinct days and spans no more than two hours", () => {
  const rows = [row("1","angry",stamp(1,8)),row("2","fear",stamp(4,9)),row("3","angry",stamp(7,10))];
  assert.equal(detectWellnessPatterns(state(rows))[0].rule,"similar_time_pattern");
  rows[2].recordedAt=stamp(7,10,1);assert.equal(detectWellnessPatterns(state(rows)).length,0);
  const sameDay=[row("1","angry",stamp(1,8)),row("2","fear",stamp(1,9)),row("3","angry",stamp(4,10))];
  assert.equal(detectWellnessPatterns(state(sameDay)).length,0);
});
test("invalid/incomplete dates and duplicate IDs are ignored; unsaved persisted history retains its explicit cat", () => {
  for(const time of ["", "2026-10-21", "garbage","2026-02-30T10:00:00Z","2026-10-21T25:00:00Z"]) assert.equal(validDetectionTime(time),false);
  const a=row("1","angry",stamp(1,8)),b=row("2","fear",stamp(1,9));
  assert.equal(detectWellnessPatterns(state([a,a,b,{...b,id:"3",recordedAt:"invalid"}])).length,0);
  assert.equal(detectWellnessPatterns(state([a,b,row("3","fear",stamp(1,10))])).length,1);
});
test("local midnight and daylight-saving day arithmetic do not use UTC day boundaries", () => {
  const original=process.env.TZ;
  try {
    process.env.TZ="Asia/Manila";
    assert.equal(localDayKey(new Date("2026-10-20T17:00:00Z")),"2026-10-21");
    const data=state([row("1","angry","2026-10-19T17:00:00Z"),row("2","fear","2026-10-20T08:00:00Z"),row("3","angry","2026-10-21T08:00:00Z")]);
    assert.equal(detectWellnessPatterns(data).some(r=>r.rule==="consecutive_days"),false, "first two are on same local day");
    process.env.TZ="America/New_York";
    const rows=[row("1","angry",new Date(2026,2,7,8).toISOString()),row("2","fear",new Date(2026,2,8,14).toISOString()),row("3","fear",new Date(2026,2,9,20).toISOString())];
    assert.equal(detectWellnessPatterns(state(rows))[0].rule,"consecutive_days");
  } finally { if(original===undefined)delete process.env.TZ;else process.env.TZ=original; }
});
test("signatures deduplicate, acknowledged sets stay acknowledged, snoozes suppress until due, later patterns qualify", () => {
  const rows=[row("1","angry",stamp(1,8)),row("2","fear",stamp(1,9)),row("3","angry",stamp(1,10))];
  const candidates=detectWellnessPatterns(state(rows));
  const first=mergeWellnessCandidates(emptyWellnessState(),candidates,stamp(1,11));
  assert.equal(mergeWellnessCandidates(first,candidates,stamp(1,12)),first);
  const acknowledged={...first,alerts:first.alerts.map(a=>({...a,status:"acknowledged"}))};
  assert.equal(mergeWellnessCandidates(acknowledged,candidates,stamp(1,12)),acknowledged);
  const later=detectWellnessPatterns(state([...rows,row("4","fear",stamp(1,13))]));
  assert.equal(mergeWellnessCandidates(acknowledged,later,stamp(1,14)).alerts.length,2);
  const snoozed={...first,alerts:first.alerts.map(a=>({...a,status:"snoozed"})),reminders:[{alertSignature:first.alerts[0].signature,catId:"a",scheduledAt:stamp(2,9),status:"scheduled"}]};
  assert.equal(mergeWellnessCandidates(snoozed,later,stamp(1,14)),snoozed);
  assert.equal(dueWellnessAlerts(snoozed,Date.parse(stamp(2,8))).length,0);
  assert.equal(dueWellnessAlerts(snoozed,Date.parse(stamp(2,9))).length,1);
  assert.equal(remindersForDate(snoozed,new Date(stamp(2,12)),"a").length,1);
  assert.equal(remindersForDate(snoozed,new Date(stamp(2,12)),"b").length,0);
});
