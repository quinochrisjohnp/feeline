const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { mount, nodes, find } = require("./helpers/frontendHarness.cjs");
const { CAT_FORM_LIMITS } = require("../constants/catFormLimits.ts");
const theme = { colors: {}, typography: {}, fontFamily: {}, radii: {}, spacing: { sm: 12, md: 16, lg: 24, xs: 8 },
  dimensions: { button: 48, capture: 78, touchTarget: 44, icon: 24, iconSmall: 18 }, getTabBarClearance: () => 124 };
function newSession() {
  delete require.cache[require.resolve("../utils/cameraPresentation.ts")];
  return require("../utils/cameraPresentation.ts");
}
function camera(session, upload = async () => { throw new Error("No usable cat"); }, gallery = async () => ({ canceled: true, assets: null }), preference = { enabled: true, ready: true }) {
  let focused = true;
  const routes = [];
  const screen = mount("app/(screens)/(tabs)/camera.tsx", {
    router: { push: r => routes.push(r) }, globals: { performance, setTimeout: () => { throw new Error("Camera must not time out the loader"); }, console: { log() {}, error() {} } },
    dependencies: {
      "@/hooks/useCameraTipsPreference": { useCameraTipsPreference: () => preference },
      "expo-image-picker": { launchImageLibraryAsync: gallery },
      "@/utils/cameraPresentation": session,
      "@/context/WellnessContext": { useWellness: () => ({ setCameraSafe() {} }) },
      "@/constants/theme": theme,
      "@/services/detection": { uploadDetection: upload, normalizeEmotion: x => x, normalizeConfidence: x => x * 100 },
      "@react-navigation/native": { useIsFocused: () => focused },
      "expo-camera": { CameraView: "CameraView", useCameraPermissions: () => [{ granted: true }, async () => {}, async () => ({ granted: true })] },
      "react-native": { StyleSheet: { create: s => s }, AppState: { currentState: "active", addEventListener: () => ({ remove() {} }) },
        Linking: { openSettings: async () => {} }, Platform: { OS: "android" },
        View: "View", Text: "Text", TouchableOpacity: "TouchableOpacity", ScrollView: "ScrollView", ActivityIndicator: "ActivityIndicator" },
    },
  });
  screen.render();
  const blur = screen.focus[0]();
  const preview = find(screen.render(), "CameraView");
  preview.props.ref.current = { takePictureAsync: async () => ({ uri: "file:///cat.jpg" }) };
  preview.props.onCameraReady();
  return { ...screen, routes, blur: () => { focused = false; blur(); } };
}
const tips = s => find(s.render(), "/WhatToAvoidModal");

test("Camera tips open once across focus changes and route remounts, and manual help still works", () => {
  const session = newSession();
  const first = camera(session);
  assert.equal(tips(first).props.visible, true);
  tips(first).props.onClose();
  assert.equal(tips(first).props.visible, false);
  assert.ok(find(first.render(), "CameraView"));
  first.focus[0]();
  assert.equal(tips(first).props.visible, false);
  first.blur();
  assert.equal(find(first.render(), "CameraView"), undefined);
  const next = camera(session);
  assert.equal(tips(next).props.visible, false);
  nodes(next.render()).find(n => n.props?.accessibilityLabel === "What to Avoid").props.onPress();
  assert.equal(tips(next).props.visible, true);
  assert.equal(tips(camera(newSession())).props.visible, true);
});

test("photo rejection messages map to helpful copy; technical service errors stay private", () => {
  const { detectionFailureNotice } = newSession();
  for (const message of ["Not a domestic cat", "Unclear cat", "No usable cat", "Missing cat face", "Use a clear image of a cat", "cannot_predict", "could not produce a reliable prediction"]) {
    const notice = detectionFailureNotice(new Error(message));
    assert.equal(notice.photoTips, true);
    assert.equal(notice.title, "We couldn't analyze this photo");
  }
  const notice = detectionFailureNotice(new Error("Internal upstream exception secret detail"));
  assert.equal(notice.photoTips, false);
  assert.equal(notice.title, "Detection unavailable");
  assert.doesNotMatch(notice.message, /secret|exception|upstream/);
});

test("failed detection stays on Camera, opens tips, and clears on the next gallery attempt", async () => {
  const screen = camera(newSession());
  tips(screen).props.onClose();
  await find(screen.render(), "/CaptureButton").props.onPress();
  assert.equal(screen.routes.length, 0);
  let tree = screen.render();
  const modal = find(tree, '/CameraErrorModal');
  assert.equal(modal.props.notice.title, "We couldn't analyze this photo");
  modal.props.onPhotoTips();
  assert.equal(find(screen.render(), '/CameraErrorModal'), undefined);
  assert.equal(tips(screen).props.visible, true);
  tips(screen).props.onClose();
  await nodes(screen.render()).find(n => n.props?.accessibilityLabel === "Choose image from gallery").props.onPress();
  assert.equal(nodes(screen.render()).find(n => n.props?.accessibilityRole === "alert"), undefined);
  assert.equal(screen.routes.length, 0);
});

test("Add/Edit and Rename share limits without slicing existing server values", () => {
  assert.deepEqual(CAT_FORM_LIMITS, { name: 50, breed: 50, description: 500 });
  for (const initialCat of [null, { id: "cat", name: "n".repeat(80), breed: "b".repeat(70), description: "d".repeat(650), birthdate: "2020-01-01" }]) {
    const form = mount("components/cats/AddCatForm.tsx", { props: { visible: true, initialCat, onCancel() {}, onSave() {} } });
    form.render();
    const inputs = nodes(form.render()).filter(n => n.type === "TextInput");
    for (const [label, field] of [["Name", "name"], ["Breed", "breed"], ["Description", "description"]]) {
      const input = inputs.find(n => n.props.accessibilityLabel === label);
      assert.equal(input.props.maxLength, CAT_FORM_LIMITS[field]);
      assert.equal(input.props.value, initialCat?.[field] ?? "");
    }
  }
  const rename = mount("components/cats/RenameCatModal.tsx", { props: { visible: true, initialName: "n".repeat(80) } });
  const field = find(rename.render(), "/FormField");
  assert.equal(field.props.maxLength, 50);
  assert.equal(field.props.value.length, 80);
});

test("album measures its own width for three square columns and keeps the last row left aligned", () => {
  const state = { cats: [], albums: [{ id: "unknown-cats", kind: "unknown", catId: null }],
    images: Array.from({ length: 5 }, (_, i) => ({ id: String(i), albumId: "unknown-cats", imageUri: "https://example.com/cat.jpg", capturedAt: "2026-10-20T00:00:00.000Z" })), detectionRecords: [] };
  const routes = [];
  const screen = mount("app/(screens)/album-folder.tsx", { params: { albumId: "unknown-cats" }, context: () => ({ state }), router: { push: r => routes.push(r) }, dependencies: { "@/constants/theme": theme } });
  const tiles = () => nodes(screen.render()).filter(n => n.props?.accessibilityHint?.startsWith("Open photo") || n.props?.accessibilityHint === "Toggle selection");
  assert.equal(tiles().length, 0, "wait for measurement instead of flashing a wrong-width grid");
  for (const width of [271, 288, 326.5, 358, 398]) {
    nodes(screen.render()).find(n => n.props?.onLayout).props.onLayout({ nativeEvent: { layout: { width } } });
    const grid = nodes(screen.render()).find(n => n.props?.onLayout);
    assert.notEqual(grid.props.style.justifyContent, "space-between");
    const items = tiles();
    assert.equal(items.length, 5);
    const size = items[0].props.style[1];
    assert.equal(size.width, size.height);
    assert.ok(size.width * 3 + 8 <= width);
    assert.ok(width - (size.width * 3 + 8) < 0.04);
    assert.equal(items[0].props.style[0].borderWidth, 0);
    assert.equal(items[3].props.style[2].marginRight, 4);
    assert.equal(items[2].props.style[2], false);
  }
  tiles()[0].props.onPress();
  assert.equal(routes[0].pathname, "/album-photo");
  tiles()[0].props.onLongPress();
  assert.equal(tiles()[0].props.accessibilityState.checked, true);
});

test("branding config uses supplied assets and contains the complete splash in both appearances", () => {
  const { expo } = require("../app.json");
  for (const icon of [expo.icon, expo.android.icon, expo.ios.icon]) {
    assert.ok(["./components/images/logo-only.png","./components/images/logo-ios.png"].includes(icon));
    assert.ok(fs.existsSync(path.resolve(__dirname, "..", icon)));
  }
  const splash = expo.plugins.find(p => Array.isArray(p) && p[0] === "expo-splash-screen")[1];
  assert.equal(splash.image, "./components/images/logo-no-bg.png");
  assert.ok(fs.existsSync(path.resolve(__dirname, "..", splash.image)));
  assert.equal(splash.resizeMode, "contain");
  assert.equal(splash.backgroundColor, "#FFF7E9");
  assert.equal(splash.dark.backgroundColor, "#FFF7E9");
  const logo = mount("components/common/EmotionLogoGrid.tsx", { props: { size: 120 }, dependencies: {
    "../images/logo-no-bg.png": "logo-no-bg.png",
  } }).render();
  assert.equal(logo.props.resizeMode, "contain");
  assert.equal(logo.props.style.width, logo.props.style.height);
  assert.equal(logo.props.source, "logo-no-bg.png");
});


test("real upload and result navigation remain intact and rapid capture taps submit once", async () => {
  const uploaded = [];
  const screen = camera(newSession(), async uri => {
    uploaded.push(uri);
    return { catId: "cat", imageId: "image", detectionId: "detection", imageUrl: "https://example.com/real.jpg",
      emotion: "happy", confidence: 0.85, recommendations: ["Existing recommendation"] };
  });
  tips(screen).props.onClose();
  const capture = find(screen.render(), "/CaptureButton");
  await Promise.all([capture.props.onPress(), capture.props.onPress()]);
  assert.deepEqual(uploaded, ["file:///cat.jpg"]);
  assert.equal(screen.routes.length, 1);
  const route = screen.routes[0];
  assert.equal(route.pathname, "/camera-result");
  assert.equal(route.params.imageUri, "https://example.com/real.jpg");
  assert.equal(route.params.detectionId, "detection");
  assert.equal(route.params.source, "camera");
  assert.equal(route.params.emotion, "happy");
  assert.equal(route.params.confidence, "85");
});

test("loading logo fades/scales once using native driver without adding an authentication delay", () => {
  const animations = [];
  class Value {
    constructor(value) { this.value = value; }
    interpolate(range) { return range; }
  }
  const splash = mount("components/common/BrandedSplash.tsx", { dependencies: {
    "react-native": { StyleSheet: { create: s => s }, Animated: { Value, View: "AnimatedView",
      timing: (value, options) => { const a = { value, options, starts: 0, start() { this.starts++; }, stop() {} }; animations.push(a); return a; } } },
  } });
  const tree = splash.render();
  splash.render();
  assert.equal(animations.length, 1);
  assert.equal(animations[0].value.value, 0);
  assert.equal(animations[0].options.useNativeDriver, true);
  assert.equal(animations[0].options.toValue, 1);
  assert.equal(animations[0].starts, 1);
  assert.ok(animations[0].options.duration <= 500);
  assert.equal(find(tree, "Text"), undefined);
  const range = find(tree, "AnimatedView").props.style.transform[0].scale;
  assert.deepEqual(Array.from(range.outputRange), [0.92, 1]);
});


test("analysis loader follows the real pending promise through success, failure, and leaving Camera", async () => {
  for (const outcome of ["success", "failure", "leave"]) {
    let resolve, reject, uploads = 0;
    const pending = new Promise((yes, no) => { resolve = yes; reject = no; });
    const screen = camera(newSession(), () => { uploads++; return pending; });
    tips(screen).props.onClose();
    const button = find(screen.render(), "/CaptureButton");
    const work = button.props.onPress();
    await new Promise(setImmediate);
    assert.ok(find(screen.render(), "/FeelineLoadingOverlay"));
    await button.props.onPress(); assert.equal(uploads, 1);
    // Re-renders cannot fake completion; no loader timeout is allowed by this harness.
    for (let i = 0; i < 20; i++) assert.ok(find(screen.render(), "/FeelineLoadingOverlay"));
    if (outcome === "leave") { screen.blur(); assert.equal(find(screen.render(), "/FeelineLoadingOverlay"), undefined); }
    if (outcome === "failure") reject(new Error("No usable cat face"));
    else resolve({ catId: "cat", imageId: "image", detectionId: "det", imageUrl: "https://example.com/cat.jpg", emotion: "happy", confidence: 0.9 });
    await work;
    assert.equal(find(screen.render(), "/FeelineLoadingOverlay"), undefined);
    assert.equal(screen.routes.length, outcome === "success" ? 1 : 0);
    if (outcome === "failure") assert.equal(find(screen.render(), '/CameraErrorModal').props.notice.title, "We couldn't analyze this photo");
  }
});

test("gallery picker does not show analysis loader until a photo is selected", async () => {
  let select, finish;
  const screen = camera(newSession(), () => new Promise(r => { finish = r; }), () => new Promise(r => { select = r; }));
  tips(screen).props.onClose();
  const work = nodes(screen.render()).find(n => n.props?.accessibilityLabel === "Choose image from gallery").props.onPress();
  assert.equal(find(screen.render(), "/FeelineLoadingOverlay"), undefined);
  select({ canceled: false, assets: [{ uri: "file:///selected.jpg" }] });
  await new Promise(setImmediate);
  assert.ok(find(screen.render(), "/FeelineLoadingOverlay"));
  finish({ catId: "cat", imageId: "image", detectionId: "det", imageUrl: "https://example.com/selected.jpg", emotion: "neutral", confidence: 0.8 });
  await work; assert.equal(screen.routes[0].params.source, "gallery");
});

test("disabled automatic tips wait for saved preference and preserve manual access", () => {
  const preference = { enabled: false, ready: false };
  const screen = camera(newSession(), undefined, undefined, preference);
  assert.equal(tips(screen).props.visible, false);
  preference.ready = true; assert.equal(tips(screen).props.visible, false);
  nodes(screen.render()).find(n => n.props?.accessibilityLabel === "What to Avoid").props.onPress();
  assert.equal(tips(screen).props.visible, true); tips(screen).props.onClose();
  preference.enabled = true; screen.render(); assert.equal(tips(screen).props.visible, true);
  tips(screen).props.onClose(); screen.render(); assert.equal(tips(screen).props.visible, false);
});
