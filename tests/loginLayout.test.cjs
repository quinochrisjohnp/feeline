const test = require("node:test");
const assert = require("node:assert/strict");
const { mount, find } = require("./helpers/frontendHarness.cjs");

test("Login illustration responds to viewport width and height while keeping scroll fallback", () => {
  const login = mount("app/(screens)/(auth)/login.tsx", {
    dependencies: {
      "@/context/AuthContext": { useAuth: () => ({ signIn() {}, error: null }) },
      "@/constants/theme": { colors: {}, typography: {},
        dimensions: { contentMaxWidth: 600, touchTarget: 44 },
        spacing: { lg: 24, md: 16, sm: 12, xs: 8 } },
    },
  });
  // Measured viewport sizes after safe-area/keyboard avoidance, not native device simulations.
  for (const [width, height] of [[360, 720], [390, 760], [430, 850], [320, 480], [760, 320], [390, 360]]) {
    find(login.render(), "ScrollView").props.onLayout({ nativeEvent: { layout: { width, height } } });
    const tree = login.render();
    const image = find(tree, "Image");
    const size = image.props.style[1];
    assert.equal(image.props.resizeMode, "contain");
    assert.ok(size.height <= height * 0.23);
    assert.ok(size.height <= 220);
    assert.ok(size.width <= (Math.min(width, 600) - 48) * 0.75 + 0.001);
    assert.ok(Math.abs(size.width / size.height - 1122 / 1402) < 0.001);
    assert.equal(tree.props.keyboardAware, true);
    const scroll = find(tree, "ScrollView");
    assert.notEqual(scroll.props.scrollEnabled, false);
    assert.equal(scroll.props.bounces, false);
    assert.equal(scroll.props.contentContainerStyle.flexGrow, 1);
    assert.equal(scroll.props.keyboardShouldPersistTaps, "handled");
  }
});
