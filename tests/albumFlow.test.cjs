const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mount, nodes, find, modal, store } = require("./helpers/frontendHarness.cjs");
const selectors = require("../context/catDataSelectors.ts");
const { getAgeYears } = require("../utils/date.ts");
const cards = (tree) => nodes(tree).filter((node) => node.type?.endsWith?.("/CatCoverCard"));
const tiles = (tree) => nodes(tree).filter((node) => node.props?.accessibilityHint?.startsWith("Open photo") || node.props?.accessibilityHint === "Toggle selection");
const action = (tree, label) => nodes(tree).find((node) => node.props?.onPress &&
  nodes(node).some((child) => child.type === "Text" && child.props.children === label));

function measure(screen){for(const n of nodes(screen.render()))n.props?.onLayout?.({nativeEvent:{layout:{width:360,height:500}}});}
function capture(context, albumId) {
  return context().saveCapture({ albumId, imageUri: "mock:test", capturedAt: "2099-01-01T00:00:00.000Z", emotion: "happy", confidence: 90 });
}

test("albums use shared newest images; Unknown is protected; rename and delete synchronize the domain", async () => {
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
  albumCards[0].props.onPress();
  assert.equal(pushed[1].params.albumId,catAlbum.id);
  // Album management now lives in Cat Profiles; reducer/provider tests cover rename/cascade.
  assert.ok(albumCards.every(card=>card.props.onLongPress===undefined));

});

test("long press does not open a photo, Select All stays current and batch deletion cascades", async () => {
  const context = store();
  const albumId = context().state.albums[0].id;
  const other = capture(context, "unknown-cats");
  capture(context, albumId);
  const pushed = [];
  const screen = mount("app/(screens)/album-folder.tsx", { context, params: { albumId }, router: { push: (route) => pushed.push(route) } });
  measure(screen);
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
  await modal(screen.render(), "Delete these Photos?").props.onConfirm();
  assert.equal(selectors.selectImagesForAlbum(context().state, albumId).length, 0);
  expectedIds.forEach((id) => assert.equal(selectors.selectDetectionForImage(context().state, id).isSavedToAlbum, false));
  assert.ok(selectors.selectImageById(context().state, other.image.id));
  await modal(screen.render(), "Images Deleted").props.onConfirm();
  assert.equal(find(screen.render(), "/DetailScreenHeader").props.subtitle, undefined);
});

test("deselect and Back exit selection; external deletion cannot leave actionable stale IDs", async () => {
  const context = store();
  const albumId = context().state.albums[0].id;
  const screen = mount("app/(screens)/album-folder.tsx", { context, params: { albumId } });
  measure(screen);
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

test("single photo resolves imageId, exposes detection, and returns to its album after removing it while retaining history", async () => {
  const context = store();
  const saved = capture(context, "unknown-cats");
  const routes = [];
  const screen = mount("app/(screens)/album-photo.tsx", { context, params: { imageId: saved.image.id },
    router: { dismissTo: (route) => routes.push(route) } });
  measure(screen);
  let tree = screen.render();
  assert.equal(find(tree, "/DraggableDetailsLayout").props.imageUri, saved.image.imageUri);
  action(tree, "Emotion").props.onPress();
  assert.equal(find(screen.render(), "/EmotionResultCard").props.confidence, 90);
  action(screen.render(), "Delete").props.onPress();
  await modal(screen.render(), "Remove this Photo from Album?").props.onConfirm();
  assert.equal(selectors.selectImageById(context().state, saved.image.id), null);
  assert.equal(selectors.selectDetectionForImage(context().state, saved.image.id).isSavedToAlbum, false);
  await modal(screen.render(), "Removed from Album").props.onConfirm();
  assert.equal(routes[0].params.albumId, "unknown-cats");
});

test("missing albums, images, and detections have recoverable states", async () => {
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
  assert.ok(nodes(photo.render()).some((node) => node.props?.children === "No detection result is available for this photo."));
});

test("My Cats excludes Unknown, confirms creation, and derives profile age, latest result, and album", async () => {
  const context = store();
  const routes = [];
  const screen = mount("app/(screens)/(tabs)/status.tsx", { context,
    router: { push: (route) => routes.push(route) }, navigation: { setOptions() {} } });
  assert.equal(cards(screen.render()).length, context().state.cats.length);
  assert.equal(cards(screen.render()).some((card) => card.props.name === "Unknown Cats"), false);
  const cat = { id: "new-profile", name: "New Cat", gender: "Female", birthdate: "2024-02-29", photoUri: null, coverUri: null };
  await nodes(screen.render()).filter(n=>n.type?.endsWith?.("/AddCatForm")).at(-1).props.onSave(cat);
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

test("Add Cat picks images independently, uses a date picker with ISO storage, trims names and prevents duplicate submissions", async () => {
  const saved = [];
  const opened = [];
  const pickerCalls = [];
  const results = [
    { canceled: false, assets: [{ uri: "file:///cover.jpg" }] },
    { canceled: false, assets: [{ uri: "file:///avatar.jpg" }] },
    { canceled: true, assets: null },
    { canceled: false, assets: [] },
  ];
  const dependencies = {
    "expo-image-picker": {
      getMediaLibraryPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
      requestMediaLibraryPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
      launchImageLibraryAsync: async (options) => { pickerCalls.push(options); return results.shift(); },
    },
    "@react-native-community/datetimepicker": { __esModule: true, default: "DateTimePicker",
      DateTimePickerAndroid: { open: (options) => opened.push(options) } },
  };
  const form = mount("components/cats/AddCatForm.tsx", { props: { visible: true, onSave: (cat) => saved.push(cat), onCancel() {} }, dependencies });
  const field = (label) => nodes(form.render()).find((node) => (node.props?.accessibilityLabel ?? node.props?.label) === label);
  const imageUris = () => nodes(form.render()).filter((node) => node.type === "Image").map((node) => node.props.source.uri);

  await field("Save").props.onPress(); // nothing filled in yet
  assert.equal(saved.length, 0);

  field("Name").props.onChangeText("  Test Cat  ");
  await field("Change cover photo").props.onPress();
  await field("Change profile photo").props.onPress();
  assert.equal(pickerCalls[0].aspect.join(":"), "16:9");
  assert.equal(pickerCalls[1].aspect.join(":"), "1:1");
  assert.equal(pickerCalls[0].mediaTypes.join(), "images");
  assert.deepEqual(imageUris(), ["file:///cover.jpg", "file:///avatar.jpg"]);
  await field("Change cover photo").props.onPress(); // cancelled: keeps both images
  await field("Change profile photo").props.onPress(); // no asset: keeps both, no crash
  assert.deepEqual(imageUris(), ["file:///cover.jpg", "file:///avatar.jpg"]);

  field("Birthdate").props.onPress();
  assert.equal(typeof opened[0].maximumDate.getTime, "function");
  opened[0].onChange({ type: "set" }, new Date(2999, 0, 1)); // future: rejected
  opened[0].onChange({ type: "dismissed" }, new Date(2020, 0, 1)); // cancelled: ignored
  await field("Save").props.onPress();
  assert.equal(saved.length, 0);
  opened[0].onChange({ type: "set" }, new Date(2024, 1, 29));

  const save = field("Save");
  const pendingSave = save.props.onPress();
  await save.props.onPress();
  await pendingSave;
  assert.equal(saved.length, 1);
  assert.equal(saved[0].name, "Test Cat");
  assert.equal(saved[0].birthdate, "2024-02-29");
  assert.equal(saved[0].photoUri, "file:///avatar.jpg");
  assert.equal(saved[0].coverUri, "file:///cover.jpg");
  assert.equal("age" in saved[0], false);
});

test("album cards suppress tap after a long press and expose the full accessible name", async () => {
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
