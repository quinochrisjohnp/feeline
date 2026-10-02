const test = require("node:test");
const assert = require("node:assert/strict");
const { mount, find } = require("./helpers/frontendHarness.cjs");
require.extensions[".png"] = (module, filename) => { module.exports = filename; };
const backgroundImage = tree => tree.props.children || undefined;
const config = require("../constants/moduleBackgrounds.ts");

test("all six modules resolve the supplied asset mapping", () => {
  for (const [module, file] of Object.entries({ auth: "bg1.png", settings: "bg1.png", camera: "bg2.png",
    calendar: "bg2.png", album: "bg3.png", catProfile: "bg3.png" })) {
    assert.ok(config.moduleBackgroundConfig[module].image.endsWith(file));
  }
});

test("individual and global switches restore cream without affecting other module settings", () => {
  const settings = { ...config, moduleBackgroundConfig: Object.fromEntries(
    Object.entries(config.moduleBackgroundConfig).map(([key, value]) => [key, { ...value }])) };
  const render = (module) => mount("components/common/ModuleBackground.tsx", {
    props: { module }, dependencies: {
      "@/constants/moduleBackgrounds": settings,
      "react-native": { Image: Object.assign(function Image() {}, { resolveAssetSource: () => ({ width: 853, height: 1844 }) }),
        View: "View", StyleSheet: { create: value => value }, Keyboard: { isVisible: () => false },
        useWindowDimensions: () => ({ width: 390, height: 844 }) },
      "@/constants/theme": { colors: { background: "#FFF7E9" } },
    },
  }).render();
  assert.ok(backgroundImage(render("album")));
  settings.moduleBackgroundConfig.album.mode = "color";
  assert.equal(backgroundImage(render("album")), undefined);
  assert.ok(backgroundImage(render("calendar")));
  settings.ENABLE_MODULE_BACKGROUNDS = false;
  for (const module of Object.keys(settings.moduleBackgroundConfig)) {
    const tree = render(module);
    assert.equal(backgroundImage(tree), undefined);
    assert.equal(tree.props.style.backgroundColor, "#FFF7E9");
    assert.equal(tree.props.pointerEvents, "none");
    assert.equal(tree.props.importantForAccessibility, "no-hide-descendants");
  }
  settings.ENABLE_MODULE_BACKGROUNDS = true;
  assert.equal(backgroundImage(render("album")), undefined);
  settings.moduleBackgroundConfig.album.mode = "image";
  assert.equal(backgroundImage(render("album")).props.resizeMode, "contain");
});

test("screen background stays outside the keyboard and scroll content", () => {
  const tree = mount("components/common/ScreenContainer.tsx", {
    props: { module: "auth", keyboardAware: true, scroll: true },
    dependencies: { "react-native-safe-area-context": {
      SafeAreaView: "SafeAreaView", useSafeAreaInsets: () => ({ bottom: 0 }),
    } },
  }).render();
  assert.equal(tree.props.children[0].props.module, "auth");
  assert.equal(tree.props.children[1].type, "SafeAreaView");
  assert.equal(find(tree.props.children[1], "ScrollView").props.keyboardShouldPersistTaps, "handled");
  assert.equal(find(tree.props.children[1], "ModuleBackground"), undefined);
});

test("all backgrounds fit measured viewport bounds and stay anchored during keyboard resizing", () => {
  let keyboardVisible = false;
  for (const module of ["auth", "settings", "calendar", "camera", "album", "catProfile"]) {
    const screen = mount("components/common/ModuleBackground.tsx", {
      props: { module }, dependencies: {
        "@/constants/moduleBackgrounds": config,
        "react-native": { Image: Object.assign(function Image() {}, { resolveAssetSource: () => ({ width: 853, height: 1844 }) }),
          View: "View", StyleSheet: { create: value => value }, Keyboard: { isVisible: () => keyboardVisible },
          useWindowDimensions: () => ({ width: 390, height: 844 }) },
      },
    });
    for (const [width, height] of [[320, 568], [390, 844], [430, 932], [844, 390]]) {
      screen.render().props.onLayout({ nativeEvent: { layout: { width, height } } });
      const style = backgroundImage(screen.render()).props.style;
      assert.ok(style.width <= width + 1e-8);
      assert.ok(style.height <= height + 1e-8);
      assert.ok(Math.abs(style.width / style.height - 853 / 1844) < 1e-8);
      assert.ok(style.left >= -1e-8 && style.top >= -1e-8);
      keyboardVisible = true;
      screen.render().props.onLayout({ nativeEvent: { layout: { width, height: height / 2 } } });
      assert.deepEqual(backgroundImage(screen.render()).props.style, style);
      keyboardVisible = false;
    }
  }
});
