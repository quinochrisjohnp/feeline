const { test } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mount, nodes, find, modal, store } = require("./helpers/frontendHarness.cjs");
const selectors = require("../context/catDataSelectors.ts");
const { getMonthMatrix, getWeekDates, toDateOnly } = require("../utils/date.ts");
const { createMockCapture } = require("../services/mockDetection.ts");
const calendarFile = "app/(screens)/(tabs)/calendar.tsx";
const rows = (tree) => nodes(tree).filter((node) => node.type === "@/components/calendar/DetectionListRow");
const days = (tree) => nodes(tree).filter((node) => node.type === "@/components/calendar/CalendarDay");
const filter = (screen, id) => find(screen.render(), "/CatFilterModal").props.onSelect(id);
const select = (screen, date) => {
  // Use the compact strip's actual date-selection callback to select any test date.
  find(screen.render(), "ScrollView").props.onScroll({ nativeEvent: { contentOffset: { y: 600 } } });
  find(screen.render(), "/CompactWeekStrip").props.onSelectDate(date);
};

function emptyContext() {
  const context = store();
  context().deleteImages(context().state.images.map((image) => image.id));
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

test("history filters normalized ownership, sorts timestamp ties by ID, and skips invalid chains without mutation", () => {
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
    [early.detection.id, ...[a.detection.id, b.detection.id].sort()]);
  assert.equal(selectors.selectCalendarRecordsForDate(invalid, date, album.catId).length, 2);
  assert.deepEqual(selectors.selectCalendarRecordsForDate(invalid, date, "unknown-cats").map((r) => r.id), [b.detection.id]);
  assert.equal(selectors.selectCalendarRecords({ ...state, cats: [] }).length, 1);
  assert.equal(selectors.selectCalendarRecords({ ...state, albums: [] }).length, 0);
  assert.equal(selectors.selectCalendarRecords({ ...state, albums: state.albums.map((x) => x.kind === "unknown" ? { ...x, catId: "fake" } : x) }, "unknown-cats").length, 0);
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
  const strip = find(tree, "/CompactWeekStrip");
  assert.equal(strip.props.activityForDate(date).recordCount, 1);
  assert.equal(strip.props.activityForDate(date).emotion, "happy");
  assert.equal(days(tree).find((day) => day.props.isSelected).props.emotion, "happy");
  strip.props.onExpand();
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
  find(screen.render(), "ScrollView").props.onScroll({ nativeEvent: { contentOffset: { y: 0 } } });
  assert.equal(find(screen.render(), "/CompactWeekStrip"), undefined);
});

test("Camera result -> Save -> Calendar -> canonical photo -> Delete updates both album and history", () => {
  for (const unknown of [false, true]) {
    const context = emptyContext();
    const album = context().state.albums.find((album) => album.kind === (unknown ? "unknown" : "cat"));
    const date = new Date(2026, 8, 19, 14, 35);
    const params = createMockCapture("angry", date.toISOString(), "file:///cache/calendar-cat.jpg", "camera");
    let saveRoute;
    const result = mount("app/(screens)/camera-result.tsx", { params, router: { replace: (route) => { saveRoute = route; } } });
    find(result.render(), "/DetailScreenHeader").props.rightElement.props.onPress();
    const save = mount("app/(screens)/camera-save.tsx", { context, params: saveRoute.params, router: { dismissTo() {} } });
    find(save.render(), "FlatList").props.renderItem({ item: album }).props.onPress();
    modal(save.render(), "Save image").props.onConfirm();
    modal(save.render(), "Image Saved!").props.onConfirm();
    let photoRoute;
    const calendar = mount(calendarFile, { context, router: { push: (route) => { photoRoute = route; } } });
    select(calendar, date);
    filter(calendar, unknown ? "unknown-cats" : album.catId);
    const events = rows(calendar.render());
    assert.equal(events.length, 1);
    assert.equal(events[0].props.emotion, "angry");
    events[0].props.onPress();
    const image = context().state.images[0];
    assert.equal(photoRoute.pathname, "/album-photo");
    assert.equal(photoRoute.params.imageId, image.id);
    const routes = [];
    const photo = mount("app/(screens)/album-photo.tsx", { context, params: photoRoute.params, router: { dismissTo: (route) => routes.push(route) } });
    assert.equal(find(photo.render(), "/EmotionResultCard").props.confidence, 90);
    assert.equal(find(photo.render(), "/MockPhoto").props.imageUri, params.imageUri);
    nodes(photo.render()).find((node) => node.props?.accessibilityLabel === "Delete").props.onPress();
    modal(photo.render(), "Delete this Photo?").props.onConfirm();
    modal(photo.render(), "Image Deleted").props.onConfirm();
    assert.equal(routes.at(-1), "/calendar");
    assert.equal(rows(calendar.render()).length, 0);
    assert.equal(selectors.selectImagesForAlbum(context().state, album.id).length, 0);
    assert.equal(context().state.detectionRecords.length, 0);
    assert.ok(find(calendar.render(), "/EmptyState"));
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

test("birthday rows and multiple-event markers follow the filter; batch deletion removes markers and rows", () => {
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
  context().deleteImages([a.image.id, b.image.id]);
  assert.equal(rows(screen.render()).length, 0);
  assert.equal(selectedDay().props.recordCount, 0);
  assert.equal(selectedDay().props.birthdayCount, 1);
  assert.equal(find(screen.render(), "/EmptyState"), undefined);
});
