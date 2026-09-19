const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const root = path.join(__dirname, "..");

require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, filename);
};
const detector = require("../services/mockDetection.ts");
const { initialCatDataState } = require("../data/initialAppData.ts");
const selectors = require("../context/catDataSelectors.ts");
const capturedAt = "2026-09-18T08:30:00.000Z";

// A small hook harness exercises the actual route callbacks and provider/reducer.
// It does not simulate native layout, gestures, or React scheduling.
function mount(file, { params = {}, context, router = {}, globals = {} } = {}) {
  const slots = [];
  let cursor = 0;
  const focus = [];
  const mocks = {
    react: { ...React,
      useState: (initial) => {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
        return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
      },
      useRef: (initial) => {
        const index = cursor++;
        return slots[index] ?? (slots[index] = { current: initial });
      },
      useReducer: (reducer, initial) => {
        const index = cursor++;
        slots[index] ??= initial;
        return [slots[index], (action) => { slots[index] = reducer(slots[index], action); }];
      },
      useMemo: (fn) => fn(), useCallback: (fn) => fn,
    },
    "expo-router": { useLocalSearchParams: () => params, useRouter: () => router,
      useFocusEffect: (fn) => { focus.push(fn); } },
    "react-native": { StyleSheet: { create: (styles) => styles },
      BackHandler: { addEventListener: () => ({ remove() {} }) },
      View: "View", Text: "Text", TouchableOpacity: "TouchableOpacity",
      ScrollView: "ScrollView", FlatList: "FlatList", ActivityIndicator: "ActivityIndicator" },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    "@/constants/theme": { colors: {}, spacing: {}, dimensions: {}, radii: {}, shadows: {}, typography: {},
      getTabBarClearance: () => 100 },
    "@/context/CatDataContext": { useCatData: () => context() },
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports, setTimeout, clearTimeout, ...globals, require: (id) => {
    if (id in mocks) return mocks[id];
    if (id === "react/jsx-runtime") return require(id);
    if (id.includes("components/")) return { __esModule: true, default: id };
    if (id.startsWith("@/")) return require(path.join(root, id.slice(2)) + ".ts");
    if (id.startsWith("./")) return require(path.join(path.dirname(path.join(root, file)), id) + ".ts");
    throw new Error("Unexpected dependency: " + id);
  } }, { filename: file });
  return { render: () => { cursor = 0; focus.length = 0; return (exports.default ?? exports.CatDataProvider)({ children: null }); }, focus };
}

function nodes(node) {
  return [node, ...React.Children.toArray(node?.props?.children).flatMap(nodes)];
}
function find(tree, name) {
  return nodes(tree).find((node) => typeof node.type === "string" && node.type.endsWith(name));
}
function modal(tree, title) {
  return nodes(tree).find((node) => node.props?.title?.startsWith(title));
}
function store() {
  const provider = mount("context/CatDataContext.tsx");
  return () => provider.render().props.value;
}

test("mock samples are deterministic, cover every scenario, and use the prototype's 90%/20% examples", () => {
  const before = JSON.stringify(initialCatDataState);
  for (const sample of detector.MOCK_SAMPLES) {
    const capture = detector.createMockCapture(sample.id, capturedAt);
    assert.deepEqual(detector.parseMockCapture(capture), capture);
    assert.deepEqual(detector.detectMockCapture(capture), sample.result);
    assert.deepEqual(detector.detectMockCapture(capture), detector.detectMockCapture(capture));
  }
  assert.equal(detector.detectMockCapture(detector.createMockCapture("angry", capturedAt)).confidence, 90);
  assert.equal(detector.detectMockCapture(detector.createMockCapture("low", capturedAt)).confidence, 20);
  assert.deepEqual(new Set(detector.MOCK_SAMPLES.filter((sample) => sample.result.outcome === "normal")
    .map((sample) => sample.result.emotion)), new Set(["happy", "neutral", "fear", "angry"]));
  assert.equal(JSON.stringify(initialCatDataState), before);
});

test("malformed route values cannot silently become savable captures", () => {
  const valid = detector.createMockCapture("angry", capturedAt);
  for (const invalid of [{}, { ...valid, sampleId: "unknown" }, { ...valid, sampleId: ["angry"] },
    { ...valid, capturedAt: "bad" }, { ...valid, capturedAt: "2026-02-30T08:30:00.000Z" },
    { ...valid, imageUri: "https://example.com/photo.jpg" }, { ...valid, capturedAt: [capturedAt] },
    { ...valid, imageUri: detector.mockImageUri("low") }]) {
    assert.equal(detector.parseMockCapture(invalid), null);
  }
});

test("capture guards rapid taps, carries photo/time, and cancels review when the camera loses focus", () => {
  const pushed = [];
  let pending;
  const camera = mount("app/(screens)/(tabs)/camera.tsx", {
    router: { push: (route) => pushed.push(route) },
    globals: { setTimeout: (fn) => { pending = fn; return 1; }, clearTimeout: () => { pending = null; } },
  });
  let tree = camera.render();
  const blur = camera.focus[0]();
  const capture = find(tree, "/CaptureButton");
  capture.props.onPress();
  capture.props.onPress();
  tree = camera.render();
  assert.equal(find(tree, "/CaptureButton").props.disabled, true);
  pending();
  assert.equal(pushed.length, 1);
  assert.ok(detector.parseMockCapture(pushed[0].params));
  assert.equal(pushed[0].params.sampleId, "angry");
  blur();
  camera.focus[0]();
  find(camera.render(), "/CaptureButton").props.onPress();
  blur();
  assert.equal(pending, null);
  assert.equal(pushed.length, 1);
});

test("each result retries without writes; only normal results navigate to Save and preserve the capture", () => {
  for (const sample of detector.MOCK_SAMPLES) {
    const params = detector.createMockCapture(sample.id, capturedAt);
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
    const params = detector.createMockCapture("angry", capturedAt);
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
    assert.equal(image.capturedAt, capturedAt);
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
  const params = detector.createMockCapture("happy", capturedAt);
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
    .map((sample) => detector.createMockCapture(sample.id, capturedAt))]) {
    const save = mount("app/(screens)/camera-save.tsx", { params, context });
    assert.ok(find(save.render(), "/EmptyState"));
    assert.equal(context().state, before);
  }
  const save = mount("app/(screens)/camera-save.tsx", {
    params: detector.createMockCapture("angry", capturedAt), context,
  });
  const album = before.albums.find((item) => item.kind === "cat");
  find(save.render(), "FlatList").props.renderItem({ item: album }).props.onPress();
  context().deleteCat(album.catId);
  const afterDeletion = context().state;
  modal(save.render(), "Save image").props.onConfirm();
  assert.equal(context().state, afterDeletion);
});
