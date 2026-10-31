const { test } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mount, nodes, find, modal, store } = require("./helpers/frontendHarness.cjs");
const selectors = require("../context/catDataSelectors.ts");
const { getMonthMatrix, getWeekDates, toDateOnly } = require("../utils/date.ts");

const calendarFile = "app/(screens)/(tabs)/calendar.tsx";
const rows = (tree) => nodes(tree).filter((node) => node.type === "@/components/calendar/DetectionListRow");
const days = (tree) => nodes(tree).filter((node) => node.type === "@/components/calendar/CalendarDay");
const filter = (screen, id) => find(screen.render(), "/CatFilterModal").props.onSelect(id);
const select = (screen, date) => {
  find(screen.render(), "/CalendarHeader").props.onChooseDate();
  screen.pickDate(date);
};

function emptyContext() {
  const context = store({emptyHistory:true});
  return context;
}
function capture(context, albumId, date, emotion = "happy") {
  return context().saveCapture({ albumId, capturedAt: date.toISOString(), imageUri: "mock:calendar", emotion, confidence: 90 });
}

test("month grids cover leap years, short months, and year boundaries with local Sunday-first weeks", () => {
  for (const [year, month, count] of [[2024, 1, 29], [2025, 1, 28], [2026, 3, 30], [2026, 11, 31], [2027, 0, 31]]) {
    const cells = getMonthMatrix(new Date(year, month, 1));
    assert.equal(cells.length, 42);
    assert.equal(cells[0].date.getDay(), 0);
    assert.equal(cells.filter((cell) => cell.inCurrentMonth).length, count);
    assert.equal(new Set(cells.map((cell) => toDateOnly(cell.date))).size, 42);
    cells.slice(1).forEach((cell, i) => assert.equal(toDateOnly(cell.date),
      toDateOnly(new Date(cells[i].date.getFullYear(), cells[i].date.getMonth(), cells[i].date.getDate() + 1))));
  }
  const week = getWeekDates(new Date(2027, 0, 1));
  assert.equal(toDateOnly(week[0]), "2026-12-27");
  assert.equal(toDateOnly(week[6]), "2027-01-02");
});

test("recordedAt determines local day across UTC month boundaries and DST", () => {
  for (const [tz, expected] of [["Asia/Manila", "2026-03-01"], ["America/Los_Angeles", "2026-02-28"]]) {
    execFileSync(process.execPath, ["-e", `
      require('./tests/helpers/frontendHarness.cjs');
      const assert = require('node:assert/strict');
      const s = require('./context/catDataSelectors.ts');
      const d = require('./utils/date.ts');
      const record = { id: 'd', imageId: 'i', emotion: 'happy', confidence: 90, recordedAt: '2026-02-28T23:30:00Z' };
      const state = { cats: [], albums: [{ id: 'unknown-cats', kind: 'unknown', catId: null }],
        images: [{ id: 'i', albumId: 'unknown-cats', capturedAt: '2026-02-01T00:00:00Z' }], detectionRecords: [record] };
      assert.equal(d.toDateOnly(new Date(record.recordedAt)), '${expected}');
      assert.equal(s.selectCalendarRecordsForDate(state, new Date('${expected}T12:00:00')).length, 1);
      assert.equal(s.selectCalendarRecordsForDate(state, new Date('2026-02-01T12:00:00')).length, 0);
      const grid = d.getMonthMatrix(new Date(2026, 2, 1));
      assert.equal(new Set(grid.map(c => d.toDateOnly(c.date))).size, 42);
    `], { cwd: require("node:path").join(__dirname, ".."), env: { ...process.env, TZ: tz } });
  }
});

test("history filters explicit ownership independently of Album membership, sorts ties, and skips invalid dates/emotions", () => {
  const context = emptyContext();
  const date = new Date(2026, 8, 19, 12);
  const album = context().state.albums.find((album) => album.kind === "cat");
  const a = capture(context, album.id, date);
  const b = capture(context, "unknown-cats", date, "fear");
  const early = capture(context, album.id, new Date(2026, 8, 19, 8), "neutral");
  const state = context().state;
  const invalid = { ...state, images: [...state.images, { ...a.image, id: "missing-album", albumId: "gone" }],
    detectionRecords: [...state.detectionRecords,
      { ...a.detection, id: "orphan", imageId: "gone" },
      { ...a.detection, id: "orphan-album", imageId: "missing-album" },
      { ...a.detection, id: "bad-date", recordedAt: "bad" },
      { ...a.detection, id: "bad-emotion", emotion: "sad" }] };
  const before = JSON.stringify(invalid);
  assert.deepEqual(selectors.selectCalendarRecordsForDate(invalid, date).map((r) => r.id),
    [early.detection.id, ...[a.detection.id, b.detection.id,"orphan","orphan-album"].sort()]);
  assert.equal(selectors.selectCalendarRecordsForDate(invalid, date, album.catId).length, 4);
  assert.deepEqual(selectors.selectCalendarRecordsForDate(invalid, date, "unknown-cats").map((r) => r.id), [b.detection.id]);
  assert.equal(selectors.selectCalendarRecords({ ...state, cats: [] }).length, 3);
  assert.equal(selectors.selectCalendarRecords({ ...state, albums: [] }).length, 3);
  assert.equal(selectors.selectCalendarRecords({ ...state, albums: state.albums.map((x) => x.kind === "unknown" ? { ...x, catId: "fake" } : x) }, "unknown-cats").length, 1);
  assert.equal(JSON.stringify(invalid), before);
});

test("birthdays derive month/day, obey filters, skip invalid dates and never invent a leap-day anniversary", () => {
  const context = emptyContext();
  const cat = { id: "birthday", name: "Leap", birthdate: "2024-02-29", gender: "Female", photoUri: null, coverUri: null };
  context().addCat(cat);
  const state = context().state;
  assert.deepEqual(selectors.selectBirthdayCatsForDate(state, new Date(2028, 1, 29), cat.id), [cat]);
  for (const date of [new Date(2025, 1, 28), new Date(2025, 2, 1), new Date(2020, 1, 29)]) {
    assert.equal(selectors.selectBirthdayCatsForDate(state, date, cat.id).length, 0);
  }
  assert.equal(selectors.selectBirthdayCatsForDate(state, new Date(2028, 1, 29), "unknown-cats").length, 0);
  assert.ok(selectors.selectBirthdayCatsForDate(state, new Date(2028, 1, 29)).some((c) => c.id === cat.id));
  assert.equal(selectors.selectBirthdayCatsForDate({ ...state, cats: [{ ...cat, birthdate: "2024-02-30" }] }, new Date(2028, 2, 1)).length, 0);
});

test("date navigation, Today, filtered markers, compact week, and deleted-filter fallback stay synchronized", () => {
  const context = emptyContext();
  const date = new Date(2026, 11, 31, 12);
  const album = context().state.albums.find((album) => album.kind === "cat");
  capture(context, album.id, date, "happy");
  capture(context, "unknown-cats", date, "angry");
  const screen = mount(calendarFile, { context });
  select(screen, date);
  filter(screen, album.catId);
  let tree = screen.render();
  assert.equal(rows(tree).length, 1);
  assert.equal(rows(tree)[0].props.emotion, "happy");
  assert.equal(days(tree).find(day=>day.props.isSelected).props.recordCount,1);
  find(tree,"SheetHandle").props.panel.snap(1);
  assert.equal(days(screen.render()).length,7);
  assert.equal(days(screen.render()).find(day=>day.props.isSelected).props.emotion,"happy");
  find(screen.render(),"SheetHandle").props.panel.snap(0);
  assert.equal(find(screen.render(), "/CompactWeekStrip"), undefined);
  find(screen.render(), "/CalendarHeader").props.onNext();
  tree = screen.render();
  assert.equal(days(tree).find((day) => day.props.isSelected).props.day, 1);
  assert.match(find(tree, "/CalendarHeader").props.label, /2027/);
  find(tree, "/CalendarHeader").props.onPrev();
  assert.match(find(screen.render(), "/CalendarHeader").props.label, /2026/);
  find(screen.render(), "/CalendarHeader").props.onToday();
  assert.ok(days(screen.render()).some((day) => day.props.isToday && day.props.isSelected));
  assert.equal(find(screen.render(), "/CatFilterModal").props.selectedCatId, album.catId);
  context().deleteCat(album.catId);
  assert.equal(find(screen.render(), "/CatFilterModal").props.selectedCatId, null);
  select(screen, date);
  assert.equal(rows(screen.render())[0].props.catName, "Unknown Cats");
  find(screen.render(), "SheetHandle").props.panel.snap(0);
  assert.equal(find(screen.render(), "/CompactWeekStrip"), undefined);
});

test("API-backed history opens its canonical photo; album removal preserves Calendar history", () => {
  for(const unknown of [false,true]){
    const context=emptyContext(),date=new Date(2026,8,19,14,35);
    const album=context().state.albums.find(a=>a.kind===(unknown?'unknown':'cat'));
    const saved=capture(context,album.id,date,'angry');let route;
    const screen=mount(calendarFile,{context,router:{push:r=>route=r}});
    select(screen,date);filter(screen,unknown?'unknown-cats':album.catId);
    assert.equal(rows(screen.render()).length,1); rows(screen.render())[0].props.onPress();
    assert.equal(route.pathname,'/album-photo');assert.equal(route.params.imageId,saved.image.id);
    context().deleteImage(saved.image.id);
    assert.equal(selectors.selectImagesForAlbum(context().state,album.id).length,0);
    assert.equal(rows(screen.render()).length,1);
    assert.equal(context().state.detectionRecords[0].isSavedToAlbum,false);
  }
});

test("empty history and empty dates are explicit; filter dismissal preserves selection", () => {
  const context = emptyContext();
  const screen = mount(calendarFile, { context });
  select(screen, new Date(2026, 6, 4));
  assert.equal(find(screen.render(), "/EmptyState").props.title, "No detections yet");
  capture(context, "unknown-cats", new Date(2026, 6, 5));
  assert.equal(find(screen.render(), "/EmptyState").props.title, "No events for this date");
  filter(screen, "unknown-cats");
  find(screen.render(), "/CatFilterModal").props.onClose();
  assert.equal(find(screen.render(), "/CatFilterModal").props.selectedCatId, "unknown-cats");
  const selected = [];
  let closed = 0;
  const picker = mount("components/calendar/CatFilterModal.tsx", { props: { visible: true,
    options: selectors.selectCalendarFilterOptions(context().state), selectedCatId: "unknown-cats",
    onSelect: (id) => selected.push(id), onClose: () => { closed++; } } });
  nodes(picker.render()).find((node) => node.props?.accessibilityLabel === "All Cats").props.onPress();
  assert.deepEqual(selected, [null]);
  assert.equal(closed, 1);
});

test("birthday rows and multiple-event markers follow the filter; album removal preserves history markers and rows", () => {
  const context = emptyContext();
  const cat = context().state.cats[0];
  const album = selectors.selectAlbumForCat(context().state, cat.id);
  context().updateCat(cat.id, { birthdate: "2024-07-04" });
  const date = new Date(2026, 6, 4, 12);
  const a = capture(context, album.id, date);
  const b = capture(context, album.id, new Date(2026, 6, 4, 13), "neutral");
  const screen = mount(calendarFile, { context });
  select(screen, date);
  filter(screen, cat.id);
  const selectedDay = () => days(screen.render()).find((day) => day.props.isSelected);
  assert.equal(selectedDay().props.recordCount, 2);
  assert.equal(selectedDay().props.birthdayCount, 1);
  assert.equal(selectedDay().props.emotion, "neutral");
  assert.ok(nodes(screen.render()).some((node) => node.props?.accessibilityLabel === `${cat.name}, Birthday, All Day`));
  filter(screen, "unknown-cats");
  assert.equal(selectedDay().props.birthdayCount, 0);
  assert.equal(rows(screen.render()).length, 0);
  filter(screen, cat.id);
  const ordered = nodes(screen.render());
  const reminderIndex = ordered.findIndex(n => n.type === "@/components/wellness/WellnessCalendarSection");
  const birthdayIndex = ordered.findIndex(n => n.props?.accessibilityLabel === cat.name + ", Birthday, All Day");
  const detectionIndex = ordered.findIndex(n => n.type === "@/components/calendar/DetectionListRow");
  assert.ok(reminderIndex < birthdayIndex && birthdayIndex < detectionIndex);
  context().deleteImages([a.image.id, b.image.id]);
  assert.equal(rows(screen.render()).length, 2);
  assert.equal(selectedDay().props.recordCount, 2);
  assert.equal(selectedDay().props.birthdayCount, 1);
  assert.equal(find(screen.render(), "/EmptyState"), undefined);
});

test("birthday and reminder markers occupy separate corners without widening the date label", () => {
 const tree = mount("components/calendar/CalendarDay.tsx", {
  props: { day: 24, dateLabel: "October 24", birthdayCount: 1, reminderCount: 1, recordCount: 3, emotion: "happy" },
  dependencies: { "@/constants/theme": { colors: { emotion: { happy: "#A8D8B9" } }, radii: {}, spacing: {}, typography: {} }, "@/utils/emotion": require("../utils/emotion.ts"), "@/types/models": require("../types/models.ts") },
 }).render();
 const all = nodes(tree);
 const birthday = all.find(n => n.props?.testID === "calendar-birthday-marker");
 const reminder = all.find(n => n.props?.testID === "calendar-reminder-marker");
 assert.ok(birthday && reminder);
 assert.equal(birthday.props.style[1].left, -3);
 assert.equal(reminder.props.style[1].right, -3);
 assert.ok(all.some(n => n.type === "Text" && n.props.children === 24));
 assert.match(tree.props.accessibilityLabel, /1 wellness reminder/);
 assert.match(tree.props.accessibilityLabel, /1 birthday/);
});

test("horizontal calendar navigation advances months or seven days without expanding week view", () => {
 const context = emptyContext();
 const screen = mount(calendarFile, { context });
 select(screen, new Date(2026, 11, 31, 12));
 const swipe = offset => find(screen.render(), "CalendarSwipeArea").props.onSwipe(offset);
 swipe(1);
 assert.match(find(screen.render(), "/CalendarHeader").props.label, /2027/);
 assert.equal(days(screen.render()).find(d => d.props.isSelected).props.day, 1);
 swipe(-1);
 assert.match(find(screen.render(), "/CalendarHeader").props.label, /2026/);
 select(screen, new Date(2026, 11, 31, 12));
 find(screen.render(), "SheetHandle").props.panel.snap(1);
 swipe(1);
 assert.equal(days(screen.render()).length, 7);
 assert.equal(days(screen.render()).find(d => d.props.isSelected).props.day, 7);
 assert.match(find(screen.render(), "/CalendarHeader").props.label, /2027/);
 swipe(-1);
 assert.equal(days(screen.render()).length, 7);
 assert.equal(days(screen.render()).find(d => d.props.isSelected).props.day, 31);
 const cat = context().state.cats[0];
 context().updateCat(cat.id, { name: "Very long cat name that should not displace calendar controls" });
 filter(screen, cat.id);
 const chip = nodes(screen.render()).find(n => n.props?.accessibilityLabel?.startsWith("Filter calendar:"));
 assert.equal(chip.props.style.maxWidth, "60%");
 assert.equal(chip.props.children[0].props.numberOfLines, 1);
});
test("Cat Album heading stays outside the scrolling cards", () => {
 const tree = mount("app/(screens)/(tabs)/album.tsx", { context: emptyContext() }).render();
 const scroll = find(tree, "ScrollView");
 assert.ok(nodes(tree).some(n => n.props?.children === "Cat Album"));
 assert.equal(nodes(scroll).some(n => n.props?.children === "Cat Album"), false);
});
