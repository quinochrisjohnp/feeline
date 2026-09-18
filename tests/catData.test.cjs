// Run with: node --test tests/catData.test.cjs
// Use the project's existing TypeScript compiler; no test dependency or output files.
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { catDataReducer: reduce } = require("../context/catDataReducer.ts");
const selectors = require("../context/catDataSelectors.ts");
const { initialCatDataState: initial } = require("../data/initialAppData.ts");
const { UNKNOWN_ALBUM_ID: unknown } = require("../types/models.ts");
const { birthdateFromInput, isValidBirthdate, getAgeYears, toDateOnly } = require("../utils/date.ts");

function freeze(value) {
  Object.values(value).forEach((child) => {
    if (child && typeof child === "object") freeze(child);
  });
  return Object.freeze(value);
}
freeze(initial);

function assertIntegrity(state) {
  for (const collection of Object.values(state)) {
    assert.equal(new Set(collection.map((entry) => entry.id)).size, collection.length);
  }
  assert.deepEqual(state.albums.filter((album) => album.kind === "unknown"), [
    { id: unknown, kind: "unknown", catId: null },
  ]);
  assert.ok(!state.cats.some((cat) => cat.id === unknown));
  state.cats.forEach((cat) => {
    assert.equal(state.albums.filter((album) => album.kind === "cat" && album.catId === cat.id).length, 1);
    assert.ok(isValidBirthdate(cat.birthdate));
    assert.ok(!("age" in cat));
  });
  state.albums.forEach((album) => {
    assert.ok(!("name" in album));
    if (album.kind === "cat") assert.ok(state.cats.some((cat) => cat.id === album.catId));
  });
  state.images.forEach((image) => {
    assert.ok(state.albums.some((album) => album.id === image.albumId));
    assert.equal(typeof image.imageUri, "string");
    assert.ok(!("emotion" in image));
  });
  state.detectionRecords.forEach((record) => {
    assert.ok(state.images.some((image) => image.id === record.imageId));
    assert.ok(!("catId" in record) && !("imageUri" in record));
    assert.ok(Number.isInteger(record.confidence) && record.confidence >= 0 && record.confidence <= 100);
  });
}

function capture(albumId, suffix = "new", confidence = 91) {
  return {
    type: "SAVE_CAPTURE",
    image: { id: `image-${suffix}`, albumId, imageUri: `mock:${suffix}`, capturedAt: "2026-09-18T02:30:00.000Z" },
    detection: { id: `det-${suffix}`, imageId: `image-${suffix}`, emotion: "happy", confidence, recordedAt: "2026-09-18T02:30:00.000Z" },
  };
}
const cat = { id: "cat-new", name: "Mochi", gender: "Female", birthdate: "2024-02-29", photoUri: null, coverUri: null };

test("initial state has complete normalized relationships and preserved fixtures", () => {
  assertIntegrity(initial);
  assert.equal(initial.cats.length, 4);
  assert.equal(initial.images.length, 12);
  assert.equal(initial.detectionRecords.length, 12);
});

test("adding a cat creates one album atomically; duplicate/reserved IDs are no-ops", () => {
  const next = reduce(initial, freeze({ type: "ADD_CAT", cat }));
  assertIntegrity(next);
  assert.equal(next.cats.length, initial.cats.length + 1);
  assert.ok(selectors.selectAlbumForCat(next, cat.id));
  assert.equal(reduce(next, { type: "ADD_CAT", cat }), next);
  assert.equal(reduce(initial, { type: "ADD_CAT", cat: { ...cat, id: unknown } }), initial);
  assert.equal(reduce(initial, { type: "ADD_CAT", cat: { ...cat, birthdate: "02/29/2024" } }), initial);
});

test("update allows only profile fields; rename resolves the same cat everywhere", () => {
  const original = initial.cats[0];
  const album = selectors.selectAlbumForCat(initial, original.id);
  const next = reduce(initial, { type: "UPDATE_CAT", catId: original.id,
    changes: { name: "  Julia II  ", gender: "Male", birthdate: "2020-01-01", photoUri: "mock:avatar", coverUri: "mock:cover", id: unknown, age: 99 } });
  assert.deepEqual(selectors.selectCatById(next, original.id), {
    id: original.id, name: "Julia II", gender: "Male", birthdate: "2020-01-01", photoUri: "mock:avatar", coverUri: "mock:cover",
  });
  const renamed = reduce(next, { type: "RENAME_ALBUM", albumId: album.id, name: "  Luna  " });
  assert.equal(selectors.selectAlbumName(renamed, album.id), "Luna");
  const detection = selectors.selectLatestDetectionForCat(renamed, original.id);
  assert.equal(selectors.selectCatForDetection(renamed, detection).name, "Luna");
  assert.equal(selectors.selectCalendarFilterOptions(renamed).find((entry) => entry.id === original.id).name, "Luna");
  assertIntegrity(renamed);
  for (const action of [
    { type: "UPDATE_CAT", catId: original.id, changes: { name: " " } },
    { type: "UPDATE_CAT", catId: original.id, changes: { birthdate: "2024-02-30" } },
    { type: "UPDATE_CAT", catId: "missing", changes: { name: "x" } },
    { type: "RENAME_ALBUM", albumId: album.id, name: " " },
    { type: "RENAME_ALBUM", albumId: "missing", name: "x" },
  ]) assert.equal(reduce(initial, action), initial);
});

test("Unknown Cats cannot become a profile, be edited, renamed or deleted", () => {
  for (const action of [
    { type: "UPDATE_CAT", catId: unknown, changes: { name: "x", gender: "Male", birthdate: "2020-01-01" } },
    { type: "RENAME_ALBUM", albumId: unknown, name: "x" },
    { type: "DELETE_CAT", catId: unknown },
  ]) assert.equal(reduce(initial, action), initial);
  assert.equal(selectors.selectCatById(initial, unknown), null);
  assert.equal(selectors.selectAlbumForCat(initial, unknown), null);
  assert.equal(selectors.selectAlbumName(initial, unknown), "Unknown Cats");
});

test("save adds both entities atomically, to cat and Unknown albums", () => {
  for (const albumId of [initial.albums[0].id, unknown]) {
    const action = freeze(capture(albumId));
    const next = reduce(initial, action);
    assertIntegrity(next);
    assert.equal(next.images.length, initial.images.length + 1);
    assert.equal(next.detectionRecords.length, initial.detectionRecords.length + 1);
    assert.deepEqual(selectors.selectDetectionForImage(next, action.image.id), action.detection);
    assert.equal(reduce(next, action), next);
  }
});

test("invalid saves leave neither an image nor an orphan detection", () => {
  const valid = capture(unknown);
  const invalid = [
    capture("missing"),
    { ...valid, detection: { ...valid.detection, imageId: "wrong" } },
    { ...valid, image: { ...valid.image, id: initial.images[0].id }, detection: { ...valid.detection, imageId: initial.images[0].id } },
    { ...valid, detection: { ...valid.detection, id: initial.detectionRecords[0].id } },
    { ...valid, image: { ...valid.image, imageUri: " " } },
    { ...valid, detection: { ...valid.detection, emotion: "sad" } },
    { ...valid, image: { ...valid.image, capturedAt: "invalid" } },
    ...[-1, 101, 99.5, NaN, Infinity].map((confidence) => capture(unknown, "invalid", confidence)),
  ];
  invalid.forEach((action) => assert.equal(reduce(initial, freeze(action)), initial));
  [0, 100].forEach((confidence) => assertIntegrity(reduce(initial, capture(unknown, "boundary", confidence))));
});

test("single deletion removes every connected detection but preserves its album", () => {
  const action = capture(unknown);
  const saved = reduce(initial, action);
  const multiple = { ...saved, detectionRecords: [...saved.detectionRecords, { ...action.detection, id: "second-analysis" }] };
  const next = reduce(freeze(multiple), { type: "DELETE_IMAGE", imageId: action.image.id });
  assertIntegrity(next);
  assert.equal(selectors.selectImageById(next, action.image.id), null);
  assert.ok(!next.detectionRecords.some((record) => record.imageId === action.image.id));
  assert.ok(selectors.selectAlbumById(next, unknown));
});

test("batch deletion deduplicates IDs, ignores missing IDs, and supports Select All", () => {
  const album = initial.albums[0];
  const images = selectors.selectImagesForAlbum(initial, album.id);
  const ids = images.map((image) => image.id);
  const next = reduce(initial, { type: "DELETE_IMAGES", imageIds: [...ids, ids[0], "missing"] });
  assertIntegrity(next);
  assert.equal(selectors.selectImagesForAlbum(next, album.id).length, 0);
  assert.equal(selectors.selectDetectionsForAlbum(next, album.id).length, 0);
  assert.equal(next.images.length, initial.images.length - ids.length);
  assert.equal(reduce(initial, { type: "DELETE_IMAGES", imageIds: ["missing"] }), initial);
  assert.equal(reduce(initial, { type: "DELETE_IMAGE", imageId: "missing" }), initial);
});

test("cat deletion cascades all four collections without touching Unknown Cats", () => {
  const saved = reduce(initial, capture(unknown));
  const catId = saved.cats[0].id;
  const album = selectors.selectAlbumForCat(saved, catId);
  const next = reduce(freeze(saved), { type: "DELETE_CAT", catId });
  assertIntegrity(next);
  assert.equal(selectors.selectCatById(next, catId), null);
  assert.equal(selectors.selectAlbumById(next, album.id), null);
  assert.equal(selectors.selectImagesForAlbum(next, album.id).length, 0);
  assert.equal(selectors.selectDetectionsForCat(next, catId).length, 0);
  assert.equal(selectors.selectDetectionsForAlbum(next, unknown).length, 1);
  assert.equal(reduce(next, { type: "DELETE_CAT", catId }), next);
});

test("selectors resolve newest cover, latest detection, date and Unknown filter", () => {
  assert.ok(!selectors.selectCalendarFilterOptions(initial).some((option) => option.id === unknown));
  const older = capture(unknown, "older");
  const newer = capture(unknown, "newer");
  newer.image.capturedAt = newer.detection.recordedAt = "2026-09-18T03:30:00.000Z";
  // Insertion order is deliberately different from date order.
  const state = reduce(reduce(initial, newer), older);
  assert.equal(selectors.selectAlbumCoverImage(state, unknown).id, newer.image.id);
  assert.equal(selectors.selectCatForDetection(state, newer.detection), null);
  assert.deepEqual(selectors.selectCalendarRecordsForDate(state, new Date(older.image.capturedAt), unknown), [older.detection, newer.detection]);
  assert.ok(selectors.selectCalendarFilterOptions(state).some((option) => option.id === unknown));
  const catId = initial.cats[0].id;
  const detections = selectors.selectDetectionsForCat(state, catId);
  const latest = selectors.selectLatestDetectionForCat(state, catId);
  assert.ok(detections.every((record) => Date.parse(record.recordedAt) <= Date.parse(latest.recordedAt)));
  assert.ok(selectors.selectCalendarRecordsForDate(state, new Date(latest.recordedAt), catId)
    .every((record) => selectors.selectCatForDetection(state, record).id === catId));
  assert.equal(selectors.selectAlbumCoverImage(state, "missing"), null);
});

test("reset restores all fixtures after mutations and returns independent objects", () => {
  const changed = reduce(reduce(initial, capture(unknown)), { type: "DELETE_CAT", catId: initial.cats[0].id });
  const reset = reduce(changed, { type: "RESET_MOCK_DATA" });
  assert.deepEqual(reset, initial);
  assertIntegrity(reset);
  for (const key of Object.keys(initial)) {
    assert.notEqual(reset[key], initial[key]);
    assert.notEqual(reset[key][0], initial[key][0]);
  }
});

test("reducer is deterministic and immutable across a full local lifecycle", () => {
  let state = initial;
  const actions = [
    { type: "ADD_CAT", cat },
    capture(`album-${cat.id}`),
    { type: "RENAME_ALBUM", albumId: `album-${cat.id}`, name: "Mochi II" },
    capture(unknown, "unknown"),
    { type: "DELETE_IMAGES", imageIds: ["image-new", "missing", "image-new"] },
    { type: "DELETE_CAT", catId: cat.id },
    { type: "RESET_MOCK_DATA" },
  ];
  for (const action of actions) {
    freeze(state);
    freeze(action);
    const next = reduce(state, action);
    assert.deepEqual(next, reduce(state, action));
    assertIntegrity(next);
    state = next;
  }
});

test("birthdate boundary validates calendar dates and age remains derived", () => {
  assert.equal(birthdateFromInput("02/29/2024"), "2024-02-29");
  assert.equal(birthdateFromInput("2024-02-29"), "2024-02-29");
  for (const invalid of ["02/29/2023", "04/31/2024", "13/01/2024", "garbage", ""]) {
    assert.equal(birthdateFromInput(invalid), null);
  }
  const today = new Date();
  assert.equal(getAgeYears(toDateOnly(today)), 0);
  assert.equal(getAgeYears(`${today.getFullYear() - 2}-01-01`), 2);
});
