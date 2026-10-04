const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mount, nodes, find, modal, store } = require("./helpers/frontendHarness.cjs");
const detector = require("../services/mockDetection.ts");
const { initialCatDataState } = require("../data/initialAppData.ts");
const selectors = require("../context/catDataSelectors.ts");
const capturedAt = "2026-09-18T08:30:00.000Z";

test("mock samples are deterministic, cover every scenario, and use the prototype's 90%/20% examples", () => {
  const before = JSON.stringify(initialCatDataState);
  for (const sample of detector.MOCK_SAMPLES) {
    const capture = detector.createMockCapture(sample.id, capturedAt, "file:///cache/cat.jpg", "camera");
    assert.deepEqual(detector.parseMockCapture(capture), capture);
    assert.deepEqual(detector.detectMockCapture(capture), sample.result);
    assert.deepEqual(detector.detectMockCapture(capture), detector.detectMockCapture(capture));
  }
  assert.equal(detector.detectMockCapture(detector.createMockCapture("angry", capturedAt, "file:///cache/cat.jpg", "camera")).confidence, 90);
  assert.equal(detector.detectMockCapture(detector.createMockCapture("low", capturedAt, "file:///cache/cat.jpg", "camera")).confidence, 20);
  assert.deepEqual(new Set(detector.MOCK_SAMPLES.filter((sample) => sample.result.outcome === "normal")
    .map((sample) => sample.result.emotion)), new Set(["happy", "neutral", "fear", "angry"]));
  assert.equal(JSON.stringify(initialCatDataState), before);
});

test("malformed route values cannot silently become savable captures", () => {
  const valid = detector.createMockCapture("angry", capturedAt, "file:///cache/cat.jpg", "camera");
  for (const invalid of [{}, { ...valid, sampleId: "unknown" }, { ...valid, sampleId: ["angry"] },
    { ...valid, capturedAt: "bad" }, { ...valid, capturedAt: "2026-02-30T08:30:00.000Z" },
    { ...valid, imageUri: "https://example.com/photo.jpg" }, { ...valid, capturedAt: [capturedAt] },
    { ...valid, imageUri: "mock:camera/low" }]) {
    assert.equal(detector.parseMockCapture(invalid), null);
  }
});

test("each result retries without writes; only normal results navigate to Save and preserve the capture", () => {
  for (const sample of detector.MOCK_SAMPLES) {
    const params = detector.createMockCapture(sample.id, capturedAt, "file:///cache/cat.jpg", "camera");
    const calls = [];
    const result = mount("app/(screens)/camera-result.tsx", { params,
      router: { dismissTo: (route) => calls.push(route), replace: (route) => calls.push(route) } });
    const tree = result.render();
    const header = find(tree, "/DetailScreenHeader");
    const save = header.props.rightElement;
    if (sample.result.outcome === "normal") {
      save.props.onPress();
      save.props.onPress();
      assert.equal(calls.length, 1);
      assert.deepEqual(JSON.parse(JSON.stringify(calls[0].params)), params);
    } else assert.equal(save, undefined);
    header.props.onBack();
    assert.equal(calls.at(-1), "/camera");
  }
});

test("save to a normal cat or Unknown Cats commits exactly one linked pair, even on repeated taps", () => {
  for (const albumId of [initialCatDataState.albums.find((album) => album.kind === "cat").id, "unknown-cats"]) {
    const context = store();
    const before = context().state;
    const params = detector.createMockCapture("angry", capturedAt, "file:///cache/cat.jpg", "camera");
    const routes = [];
    const save = mount("app/(screens)/camera-save.tsx", { params, context,
      router: { dismissTo: (route) => routes.push(route) } });
    let tree = save.render();
    const list = find(tree, "FlatList");
    list.props.renderItem({ item: before.albums.find((album) => album.id === albumId) }).props.onPress();
    tree = save.render();
    modal(tree, "Save image").props.onCancel();
    assert.equal(context().state, before);
    list.props.renderItem({ item: before.albums.find((album) => album.id === albumId) }).props.onPress();
    const confirm = modal(save.render(), "Save image");
    confirm.props.onConfirm();
    confirm.props.onConfirm();
    const after = context().state;
    assert.equal(after.images.length, before.images.length + 1);
    assert.equal(after.detectionRecords.length, before.detectionRecords.length + 1);
    const image = after.images[0];
    assert.equal(image.albumId, albumId);
    assert.equal(image.imageUri, params.imageUri);
    assert.equal(image.capturedAt, capturedAt, "file:///cache/cat.jpg", "camera");
    assert.equal(after.detectionRecords[0].imageId, image.id);
    assert.equal(selectors.selectDetectionForImage(after, image.id).confidence, 90);
    assert.ok(selectors.selectImagesForAlbum(after, albumId).some((savedImage) => savedImage.id === image.id));
    modal(save.render(), "Image Saved!").props.onConfirm();
    assert.deepEqual(routes, ["/camera"]);
  }
});

test("new cat creation is atomic, repeat-safe, and leaves the capture ready for its new album", () => {
  const context = store();
  const before = context().state;
  const params = detector.createMockCapture("happy", capturedAt, "file:///cache/cat.jpg", "camera");
  const save = mount("app/(screens)/camera-save.tsx", { params, context });
  const cat = { id: "test-new", name: "New cat", birthdate: "2024-01-01", gender: "Female", photoUri: null, coverUri: null };
  const form = find(save.render(), "/AddCatForm");
  form.props.onSave(cat);
  form.props.onSave({ ...cat, id: "repeat-tap" });
  assert.equal(context().state.cats.length, before.cats.length + 1);
  assert.equal(context().state.albums.length, before.albums.length + 1);
  assert.equal(context().state.images.length, before.images.length);
  let tree = save.render();
  modal(tree, "Cat Profile Saved!").props.onConfirm();
  const album = selectors.selectAlbumForCat(context().state, cat.id);
  find(tree, "FlatList").props.renderItem({ item: album }).props.onPress();
  modal(save.render(), "Save image").props.onConfirm();
  assert.equal(context().state.images[0].albumId, album.id);
  assert.equal(context().state.images[0].imageUri, params.imageUri);
});

test("low/error/invalid Save links and deleted destinations cannot mutate image state", () => {
  const context = store();
  const before = context().state;
  for (const params of [{}, ...detector.MOCK_SAMPLES.filter((sample) => sample.result.outcome !== "normal")
    .map((sample) => detector.createMockCapture(sample.id, capturedAt, "file:///cache/cat.jpg", "camera"))]) {
    const save = mount("app/(screens)/camera-save.tsx", { params, context });
    assert.ok(find(save.render(), "/EmptyState"));
    assert.equal(context().state, before);
  }
  const save = mount("app/(screens)/camera-save.tsx", {
    params: detector.createMockCapture("angry", capturedAt, "file:///cache/cat.jpg", "camera"), context,
  });
  const album = before.albums.find((item) => item.kind === "cat");
  find(save.render(), "FlatList").props.renderItem({ item: album }).props.onPress();
  context().deleteCat(album.catId);
  const afterDeletion = context().state;
  modal(save.render(), "Save image").props.onConfirm();
  assert.equal(context().state, afterDeletion);
});

function cameraHarness({ capture = async () => ({ uri: "file:///cache/real-cat.jpg" }), gallery = async () => ({ canceled: true, assets: null }), permission = { granted: true, canAskAgain: true } } = {}) {
  let focused = true;
  let pending = null;
  let settingsOpened = 0;
  let requested = 0;
  const routes = [];
  const requests = [];
  const camera = mount("app/(screens)/(tabs)/camera.tsx", {
    router: { push: (route) => routes.push(route) },
    globals: { setTimeout: (fn) => { pending = fn; return 1; }, clearTimeout: () => { pending = null; } },
    dependencies: {
      "@react-navigation/native": { useIsFocused: () => focused },
      "expo-camera": { CameraView: "CameraView", useCameraPermissions: () => [permission, async () => { requested++; }, async () => permission] },
      "expo-image-picker": { launchImageLibraryAsync: async (options) => { requests.push(options); return gallery(); } },
      "react-native": { StyleSheet: { create: (s) => s }, AppState: { currentState: "active", addEventListener: () => ({ remove() {} }) },
        Linking: { openSettings: async () => { settingsOpened++; } }, Platform: { OS: "android" },
        View: "View", Text: "Text", TouchableOpacity: "TouchableOpacity", ScrollView: "ScrollView", ActivityIndicator: "ActivityIndicator" },
    },
  });
  camera.render();
  let cleanup = camera.focus[0]();
  const render = () => camera.render();
  const makeReady = () => {
    const preview = find(render(), "CameraView");
    preview.props.ref.current = { takePictureAsync: capture };
    preview.props.onCameraReady();
  };
  const pressCapture = () => find(render(), "/CaptureButton").props.onPress();
  const pressGallery = () => nodes(render()).find((n) => n.props?.accessibilityLabel === "Choose image from gallery").props.onPress();
  return { render, makeReady, pressCapture, pressGallery, routes, requests,
    flush: () => { const fn = pending; pending = null; fn?.(); },
    blur: () => { focused = false; cleanup(); },
    focus: () => { focused = true; render(); cleanup = camera.focus[0](); },
    get pending() { return pending; }, get settingsOpened() { return settingsOpened; }, get requested() { return requested; } };
}

test("real camera/gallery and Expo web URIs are independent of the chosen scenario", () => {
  for (const source of ["camera", "gallery"]) {
    for (const imageUri of ["file:///var/mobile/cache/cat.jpg", "content://media/external/images/media/1", "ph://photo-id/L0/001", "assets-library://asset/asset.JPG?id=1", "blob:http://localhost:8081/id", "data:image/jpeg;base64,Y2F0"]) {
      const value = detector.createMockCapture("angry", capturedAt, imageUri, source);
      assert.deepEqual(detector.parseMockCapture(value), value);
      assert.equal(detector.detectMockCapture(value).confidence, 90);
      assert.equal(detector.detectMockCapture({ ...value, sampleId: "low" }).confidence, 20);
    }
  }
  const valid = detector.createMockCapture("angry", capturedAt, "file:///cache/a.jpg", "camera");
  for (const key of ["sampleId", "imageUri", "capturedAt", "source"]) {
    assert.equal(detector.parseMockCapture({ ...valid, [key]: undefined }), null);
    assert.equal(detector.parseMockCapture({ ...valid, [key]: [valid[key], valid[key]] }), null);
  }
  for (const imageUri of ["", "   ", "file://", "file:///", "javascript:alert(1)", "https://example.com/cat.jpg", "data:text/html;base64,Y2F0", "file:///cache/%zz", "mock:camera/angry"]) {
    assert.equal(detector.parseMockCapture({ ...valid, imageUri }), null, imageUri);
  }
  assert.equal(detector.parseMockCapture({ ...valid, source: "video" }), null);
});

test("camera readiness, repeated capture taps, actual URI, and blur cancellation", async () => {
  let calls = 0;
  const camera = cameraHarness({ capture: async () => { calls++; return { uri: "file:///cache/real-cat.jpg" }; } });
  assert.equal(find(camera.render(), "/CaptureButton").props.disabled, true);
  await camera.pressCapture();
  assert.equal(calls, 0);
  camera.makeReady();
  const first = camera.pressCapture();
  await camera.pressCapture();
  await first;
  assert.equal(calls, 1);
  assert.equal(find(camera.render(), "/CaptureButton").props.disabled, true);
  camera.flush();
  assert.equal(camera.routes.length, 1);
  assert.equal(camera.routes[0].params.imageUri, "file:///cache/real-cat.jpg");
  assert.equal(camera.routes[0].params.source, "camera");
  assert.ok(detector.parseMockCapture(camera.routes[0].params));
  await camera.pressCapture();
  camera.flush();
  assert.equal(camera.routes.length, 1);
  camera.blur();
  assert.equal(find(camera.render(), "CameraView"), undefined);
  camera.focus();
  assert.ok(find(camera.render(), "CameraView"));
  assert.equal(find(camera.render(), "/CaptureButton").props.disabled, true);
  camera.makeReady();
  await camera.pressCapture();
  camera.blur();
  assert.equal(camera.pending, null);
  camera.flush();
  assert.equal(camera.routes.length, 1);
});

test("gallery uses a single unedited image and preserves the scenario and actual URI", async () => {
  const camera = cameraHarness({ gallery: async () => ({ canceled: false, assets: [{ uri: "content://media/photos/22" }] }) });
  find(camera.render(), "/MockSampleModal").props.onSelect("happy");
  await camera.pressGallery();
  assert.equal(find(camera.render(), "/MockPhoto").props.imageUri, "content://media/photos/22");
  camera.flush();
  const { params } = camera.routes[0];
  assert.equal(params.imageUri, "content://media/photos/22");
  assert.equal(params.source, "gallery");
  assert.equal(params.sampleId, "happy");
  assert.deepEqual(JSON.parse(JSON.stringify(camera.requests[0])), { mediaTypes: ["images"], allowsMultipleSelection: false, allowsEditing: false, quality: 1 });
  const routes = [];
  const result = mount("app/(screens)/camera-result.tsx", { params, router: { replace: (route) => routes.push(route) } });
  assert.equal(find(result.render(), "/MockCapturePhoto").props.imageUri, params.imageUri);
  find(result.render(), "/DetailScreenHeader").props.rightElement.props.onPress();
  assert.equal(routes[0].params.imageUri, params.imageUri);
  assert.equal(routes[0].params.source, "gallery");
});

test("gallery cancellation, failure, and missing assets unlock without navigating", async () => {
  for (const gallery of [async () => ({ canceled: true, assets: null }), async () => { throw new Error("denied"); }, async () => ({ canceled: false, assets: [] })]) {
    const camera = cameraHarness({ gallery });
    camera.makeReady();
    await camera.pressGallery();
    camera.flush();
    assert.equal(camera.routes.length, 0);
    assert.equal(find(camera.render(), "/CaptureButton").props.disabled, false);
    assert.equal(find(camera.render(), "/MockSampleModal").props.selected, "angry");
  }
});

test("capture failure or missing URI unlocks controls and permits retry", async () => {
  for (const capture of [async () => { throw new Error("native failure"); }, async () => ({}), async () => ({ uri: "bad" })]) {
    const camera = cameraHarness({ capture });
    camera.makeReady();
    await camera.pressCapture();
    assert.equal(find(camera.render(), "/CaptureButton").props.disabled, false);
    assert.ok(nodes(camera.render()).some((n) => n.props?.accessibilityRole === "alert"));
    assert.equal(camera.routes.length, 0);
  }
});

test("late native capture and gallery resolutions after blur are ignored, even after refocus", async () => {
  for (const input of ["camera", "gallery"]) {
    let resolve;
    const operation = () => new Promise((done) => { resolve = done; });
    const camera = cameraHarness(input === "camera" ? { capture: operation } : { gallery: operation });
    camera.makeReady();
    const promise = input === "camera" ? camera.pressCapture() : camera.pressGallery();
    camera.blur();
    camera.focus();
    resolve(input === "camera" ? { uri: "file:///cache/late.jpg" } : { canceled: false, assets: [{ uri: "file:///cache/late.jpg" }] });
    await promise;
    camera.flush();
    assert.equal(camera.routes.length, 0);
    assert.equal(camera.pending, null);
  }
});

test("permission states do not auto-request and keep gallery available; mount errors can retry", async () => {
  for (const permission of [null, { granted: false, canAskAgain: true }, { granted: false, canAskAgain: false }]) {
    const camera = cameraHarness({ permission });
    assert.equal(find(camera.render(), "CameraView"), undefined);
    assert.equal(find(camera.render(), "/CaptureButton").props.disabled, true);
    assert.equal(camera.requested, 0);
    await camera.pressGallery();
    assert.equal(camera.requests.length, 1);
    if (permission) {
      const action = nodes(camera.render()).find((n) => n.props?.label === (permission.canAskAgain ? "Allow Camera Access" : "Open Settings"));
      await action.props.onPress();
      assert.equal(permission.canAskAgain ? camera.requested : camera.settingsOpened, 1);
    }
  }
  const camera = cameraHarness();
  find(camera.render(), "CameraView").props.onMountError({ message: "private native details" });
  assert.equal(find(camera.render(), "CameraView"), undefined);
  nodes(camera.render()).find((n) => n.props?.label === "Retry Camera").props.onPress();
  assert.ok(find(camera.render(), "CameraView"));
});

test("capture dimensions survive result/save routes and malformed dimensions are rejected", () => {
  const capture = detector.createMockCapture("angry", capturedAt, "file:///cache/portrait.jpg", "camera", { width: 1080, height: 1920 });
  assert.equal(capture.width, "1080");
  assert.equal(capture.height, "1920");
  assert.deepEqual(detector.parseMockCapture(capture), capture);
  for (const dimensions of [{ width: ["1080"] }, { height: "0" }, { width: "NaN" }, { height: undefined }]) {
    assert.equal(detector.parseMockCapture({ ...capture, ...dimensions }), null);
  }
  const routes = [];
  const result = mount("app/(screens)/camera-result.tsx", { params: capture, router: { replace: (route) => routes.push(route) } });
  find(result.render(), "/DetailScreenHeader").props.rightElement.props.onPress();
  assert.equal(routes[0].params.width, "1080");
  assert.equal(routes[0].params.height, "1920");
});

test("returning from Result creates a fresh measured preview and allows a second capture", async () => {
  const camera = cameraHarness({ capture: async () => ({ uri: "file:///cache/portrait.jpg", width: 1080, height: 1920 }) });
  let tree = camera.render();
  const host = nodes(tree).find((n) => n.props?.collapsable === false);
  host.props.onLayout({ nativeEvent: { layout: { width: 360, height: 800 } } });
  const first = find(camera.render(), "CameraView");
  assert.equal(first.props.style[1].height, 800);
  camera.makeReady();
  await camera.pressCapture();
  camera.flush();
  assert.equal(camera.routes[0].params.height, "1920");
  camera.blur();
  camera.focus();
  const second = find(camera.render(), "CameraView");
  assert.notEqual(second.key, first.key);
  assert.equal(second.props.style[1].height, 800);
  camera.makeReady();
  await camera.pressCapture();
  camera.flush();
  assert.equal(camera.routes.length, 2);
});

test("result uses one scroll area for the photo and complete card with a fixed header", () => {
  const result = mount("app/(screens)/camera-result.tsx", { params: detector.createMockCapture("happy", capturedAt, "file:///cache/landscape.jpg", "gallery") });
  const tree = result.render();
  assert.ok(find(tree, "/DetailScreenHeader"));
  const panel = find(tree, "ScrollView");
  assert.ok(find(panel, "/EmotionResultCard"));
  assert.ok(find(panel, "/MockCapturePhoto"));
  assert.equal(nodes(tree).filter((n) => n.type === "ScrollView").length, 1);
  assert.equal(find(panel, "/DetailScreenHeader"), undefined);
  assert.deepEqual(Array.from(tree.props.edges), ["left", "right", "bottom"]);
});

test("What to Avoid uses all five assets in three rows and closes through Continue", () => {
  let closed = 0;
  const assets = Object.fromEntries(["cat_blurred", "cat_dark", "dog", "cat_cropped", "cat_deformaties"].map((name) => [`../images/${name}.png`, name]));
  const screen = mount("components/camera/WhatToAvoidModal.tsx", {
    props: { visible: true, onClose: () => closed++ },
    dependencies: { ...assets, "react-native": { StyleSheet: { create: (s) => s }, View: "View", Text: "Text", Image: "Image" } },
  });
  const tree = screen.render();
  assert.equal(tree.props.compact, true);
  assert.equal(tree.props.visible, true);
  const images = nodes(tree).filter((n) => n.type === "Image");
  assert.deepEqual(images.map((n) => n.props.source), ["cat_blurred", "cat_dark", "dog", "cat_cropped", "cat_deformaties"]);
  assert.ok(images.every((n) => n.props.resizeMode === "cover"));
  find(tree, "/Button").props.onPress();
  assert.equal(closed, 1);
});


test("result photo shape follows portrait, landscape, square and decoder dimensions without a colored frame", () => {
  for (const [width, height] of [[1080, 1920], [1920, 1080], [600, 600]]) {
    const uri = "file:///cache/photo.jpg";
    const photo = mount("components/camera/MockCapturePhoto.tsx", {
      props: { imageUri: uri, imageWidth: width, imageHeight: height },
      dependencies: { "expo-image": { Image: "ExpoImage" }, "@/data/bundledCatImages": { getBundledCatImage: () => undefined } },
    });
    const tree = photo.render();
    assert.equal(tree.props.style[1].aspectRatio, width / height);
    assert.equal(tree.props.style[0].backgroundColor, undefined);
    assert.equal(tree.props.style[0].width, "100%");
    const image = find(tree, "ExpoImage");
    assert.equal(image.props.source.uri, uri);
    assert.equal(image.props.contentFit, "contain");
    image.props.onLoad({ source: { width: 900, height: 1600 } });
    assert.equal(photo.render().props.style[1].aspectRatio, 900 / 1600);
  }
});
