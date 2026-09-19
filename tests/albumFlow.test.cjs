const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mount, nodes, find, modal, store } = require("./helpers/frontendHarness.cjs");
const selectors = require("../context/catDataSelectors.ts");
const { getAgeYears } = require("../utils/date.ts");
const cards = (tree) => nodes(tree).filter((node) => node.type?.endsWith?.("/CatCoverCard"));
const tiles = (tree) => nodes(tree).filter((node) => node.props?.accessibilityHint?.startsWith("Open photo") || node.props?.accessibilityHint === "Toggle selection");
const action = (tree, label) => nodes(tree).find((node) => node.props?.onPress &&
  nodes(node).some((child) => child.type === "Text" && child.props.children === label));

function capture(context, albumId) {
  return context().saveCapture({ albumId, imageUri: "mock:test", capturedAt: "2099-01-01T00:00:00.000Z", emotion: "happy", confidence: 90 });
}

test("albums use shared newest images; Unknown is protected; rename and delete synchronize the domain", () => {
  const context = store();
  const pushed = [];
  const screen = mount("app/(screens)/(tabs)/album.tsx", { context, router: { push: (route) => pushed.push(route) } });
  const catAlbum = context().state.albums.find((album) => album.kind === "cat");
  const saved = capture(context, catAlbum.id);
  let tree = screen.render();
  const albumCards = cards(tree);
  assert.equal(albumCards.length, context().state.albums.length);
  assert.equal(albumCards.find((card) => card.props.coverUri === saved.image.imageUri).props.name,
    selectors.selectAlbumName(context().state, catAlbum.id));
  const unknown = albumCards.find((card) => card.props.name === "Unknown Cats");
  assert.equal(unknown.props.onLongPress, undefined);
  unknown.props.onPress();
  assert.equal(pushed[0].params.albumId, "unknown-cats");
  albumCards[0].props.onLongPress();
  find(screen.render(), "/AlbumActionSheet").props.onRename();
  find(screen.render(), "/RenameCatModal").props.onSave("  Renamed  ");
  assert.equal(selectors.selectAlbumName(context().state, catAlbum.id), "Renamed");
  assert.equal(selectors.selectCatById(context().state, catAlbum.catId).name, "Renamed");
  cards(screen.render())[0].props.onLongPress();
  find(screen.render(), "/AlbumActionSheet").props.onDelete();
  modal(screen.render(), "Delete this album?").props.onCancel();
  assert.ok(selectors.selectAlbumById(context().state, catAlbum.id));
  cards(screen.render())[0].props.onLongPress();
  find(screen.render(), "/AlbumActionSheet").props.onDelete();
  modal(screen.render(), "Delete this album?").props.onConfirm();
  assert.equal(selectors.selectAlbumById(context().state, catAlbum.id), null);
  assert.equal(selectors.selectCatById(context().state, catAlbum.catId), null);
  assert.equal(selectors.selectImageById(context().state, saved.image.id), null);
  assert.equal(selectors.selectDetectionForImage(context().state, saved.image.id), null);
  assert.ok(selectors.selectAlbumById(context().state, "unknown-cats"));
});

test("long press does not open a photo, Select All stays current and batch deletion cascades", () => {
  const context = store();
  const albumId = context().state.albums[0].id;
  const other = capture(context, "unknown-cats");
  capture(context, albumId);
  const pushed = [];
  const screen = mount("app/(screens)/album-folder.tsx", { context, params: { albumId }, router: { push: (route) => pushed.push(route) } });
  let tile = tiles(screen.render())[0];
  tile.props.onPressIn();
  tile.props.onLongPress();
  tile.props.onPress();
  assert.equal(pushed.length, 0);
  let tree = screen.render();
  assert.match(find(tree, "/DetailScreenHeader").props.subtitle, /^1 selected$/);
  action(tree, "Select All").props.onPress();
  capture(context, albumId);
  tree = screen.render();
  action(tree, "Select All").props.onPress();
  tree = screen.render();
  const expectedIds = selectors.selectImagesForAlbum(context().state, albumId).map((image) => image.id);
  assert.equal(find(tree, "/DetailScreenHeader").props.subtitle, expectedIds.length + " selected");
  action(tree, "Delete").props.onPress();
  modal(screen.render(), "Delete these Photos?").props.onCancel();
  assert.equal(selectors.selectImagesForAlbum(context().state, albumId).length, expectedIds.length);
  action(screen.render(), "Delete").props.onPress();
  modal(screen.render(), "Delete these Photos?").props.onConfirm();
  assert.equal(selectors.selectImagesForAlbum(context().state, albumId).length, 0);
  expectedIds.forEach((id) => assert.equal(selectors.selectDetectionForImage(context().state, id), null));
  assert.ok(selectors.selectImageById(context().state, other.image.id));
  modal(screen.render(), "Images Deleted").props.onConfirm();
  assert.equal(find(screen.render(), "/DetailScreenHeader").props.subtitle, undefined);
});

test("deselect and Back exit selection; external deletion cannot leave actionable stale IDs", () => {
  const context = store();
  const albumId = context().state.albums[0].id;
  const screen = mount("app/(screens)/album-folder.tsx", { context, params: { albumId } });
  tiles(screen.render())[0].props.onLongPress();
  action(screen.render(), "Select All").props.onPress();
  action(screen.render(), "Deselect All").props.onPress();
  assert.equal(action(screen.render(), "Download").props.disabled, true);
  find(screen.render(), "/DetailScreenHeader").props.onBack();
  assert.equal(find(screen.render(), "/DetailScreenHeader").props.subtitle, undefined);
  tiles(screen.render())[0].props.onLongPress();
  screen.render();
  screen.focus[0]();
  assert.equal(screen.hardwareBack.at(-1)(), true);
  assert.equal(find(screen.render(), "/DetailScreenHeader").props.subtitle, undefined);
  tiles(screen.render())[0].props.onLongPress();
  context().deleteImages(selectors.selectImagesForAlbum(context().state, albumId).map((image) => image.id));
  const tree = screen.render();
  assert.equal(action(tree, "Download").props.disabled, true);
  assert.equal(action(tree, "Delete").props.disabled, true);
});

test("single photo resolves imageId, exposes detection, and returns to its album after deleting both", () => {
  const context = store();
  const saved = capture(context, "unknown-cats");
  const routes = [];
  const screen = mount("app/(screens)/album-photo.tsx", { context, params: { imageId: saved.image.id },
    router: { dismissTo: (route) => routes.push(route) } });
  let tree = screen.render();
  assert.equal(find(tree, "/MockPhoto").props.imageUri, saved.image.imageUri);
  action(tree, "Emotion").props.onPress();
  assert.equal(find(screen.render(), "/EmotionResultCard").props.confidence, 90);
  action(screen.render(), "Delete").props.onPress();
  modal(screen.render(), "Delete this Photo?").props.onConfirm();
  assert.equal(selectors.selectImageById(context().state, saved.image.id), null);
  assert.equal(selectors.selectDetectionForImage(context().state, saved.image.id), null);
  modal(screen.render(), "Image Deleted").props.onConfirm();
  assert.equal(routes[0].params.albumId, "unknown-cats");
});

test("missing albums, images, and detections have recoverable states", () => {
  const context = store();
  for (const [file, params] of [["album-folder", { albumId: "missing" }], ["album-photo", { imageId: ["invalid"] }]]) {
    const routes = [];
    const screen = mount("app/(screens)/" + file + ".tsx", { context, params, router: { dismissTo: (route) => routes.push(route) } });
    find(screen.render(), "/EmptyState").props.onAction();
    assert.equal(routes[0], "/album");
  }
  const saved = capture(context, "unknown-cats");
  const noDetection = () => ({ ...context(), state: { ...context().state, detectionRecords: [] } });
  const photo = mount("app/(screens)/album-photo.tsx", { context: noDetection, params: { imageId: saved.image.id } });
  action(photo.render(), "Emotion").props.onPress();
  assert.ok(nodes(photo.render()).some((node) => node.props?.children === "No detection result is available for this mock photo."));
});

test("My Cats excludes Unknown, confirms creation, and derives profile age, latest result, and album", () => {
  const context = store();
  const routes = [];
  const screen = mount("app/(screens)/(tabs)/status.tsx", { context,
    router: { push: (route) => routes.push(route) }, navigation: { setOptions() {} } });
  assert.equal(cards(screen.render()).length, context().state.cats.length);
  assert.equal(cards(screen.render()).some((card) => card.props.name === "Unknown Cats"), false);
  const cat = { id: "new-profile", name: "New Cat", gender: "Female", birthdate: "2024-02-29", photoUri: null, coverUri: null };
  find(screen.render(), "/AddCatForm").props.onSave(cat);
  assert.equal(modal(screen.render(), "Cat Profile Saved!").props.visible, true);
  const album = selectors.selectAlbumForCat(context().state, cat.id);
  capture(context, album.id);
  cards(screen.render()).find((card) => card.props.name === cat.name).props.onPress();
  const tree = screen.render();
  assert.ok(nodes(tree).some((node) => node.props?.children === "Latest Detected Emotion"));
  assert.ok(JSON.stringify(tree).includes(String(getAgeYears(cat.birthdate))));
  nodes(tree).find((node) => node.props?.label === "Open Album").props.onPress();
  assert.equal(routes[0].params.albumId, album.id);
});

test("Add Cat validates required/past dates, trims names, derives age, and prevents duplicate submissions", () => {
  const saved = [];
  const form = mount("components/cats/AddCatForm.tsx", { props: { visible: true, onSave: (cat) => saved.push(cat), onCancel() {} } });
  const field = (label) => nodes(form.render()).find((node) => node.props?.label === label);
  assert.equal(field("Save").props.disabled, true);
  field("Name").props.onChangeText("  Test Cat  ");
  field("Birthdate").props.onChangeText("12/31/2999");
  assert.equal(field("Save").props.disabled, true);
  field("Birthdate").props.onChangeText("02/30/2024");
  assert.equal(field("Save").props.disabled, true);
  field("Birthdate").props.onChangeText("02/29/2024");
  const button = field("Save");
  assert.equal(button.props.disabled, false);
  button.props.onPress();
  button.props.onPress();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].name, "Test Cat");
  assert.equal(saved[0].birthdate, "2024-02-29");
  assert.equal("age" in saved[0], false);
});

test("album cards suppress tap after a long press and expose the full accessible name", () => {
  const calls = [];
  const card = mount("components/cats/CatCoverCard.tsx", { props: {
    name: "A very long cat name", onPress: () => calls.push("open"), onLongPress: () => calls.push("actions"),
  } }).render();
  card.props.onPressIn();
  card.props.onLongPress();
  card.props.onPress();
  assert.deepEqual(calls, ["actions"]);
  card.props.onPressIn();
  card.props.onPress();
  assert.deepEqual(calls, ["actions", "open"]);
  assert.equal(card.props.accessibilityLabel, "A very long cat name");
});
