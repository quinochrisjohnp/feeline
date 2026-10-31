const test = require("node:test");
const assert = require("node:assert/strict");
const { mount, find, nodes } = require("./helpers/frontendHarness.cjs");

test("Login keeps two groups, scales branding and scrolls only when measured content overflows", () => {
  let signIns = 0;
  const routes = [];
  const login = mount("app/(screens)/(auth)/login.tsx", {
    dependencies: {
      "expo-router": { useRouter: () => ({ push: path => routes.push(path) }) },
      "@/context/AuthContext": { useAuth: () => ({ signIn() { signIns++; }, isSigningIn: true, error: "Please try again." }) },
      "@/constants/theme": { colors: {}, typography: {}, fontFamily: {},
        dimensions: { contentMaxWidth: 600, touchTarget: 44, logo: 200 },
        spacing: { lg: 24, md: 16, sm: 12, xs: 8 } },
    },
  });
  // Measured safe-area viewports, including smaller/taller portrait and constrained layouts.
  for (const [width, height] of [[320, 520], [390, 760], [430, 850], [320, 480], [760, 320]]) {
    find(login.render(), "ScrollView").props.onLayout({ nativeEvent: { layout: { width, height } } });
    let tree = login.render();
    const logo = find(tree, "/EmotionLogoGrid");
    assert.ok(logo.props.size <= height * 0.26);
    assert.ok(logo.props.size <= 200);
    assert.ok(logo.props.size <= width - 48);
    assert.equal(find(tree, "Image"), undefined, "no separate cat illustration");
    const scroll = find(tree, "ScrollView");
    const content = scroll.props.children;
    assert.equal(content.props.style.justifyContent, "space-between");
    assert.equal(content.props.children.length, 2);
    assert.equal(tree.props.module, "auth");
    assert.equal(scroll.props.contentContainerStyle.flexGrow, 1);
    scroll.props.onContentSizeChange(width, height);
    assert.equal(find(login.render(), "ScrollView").props.scrollEnabled, false);
    scroll.props.onContentSizeChange(width, height + 160);
    assert.equal(find(login.render(), "ScrollView").props.scrollEnabled, true);
    scroll.props.onContentSizeChange(width, height);
    assert.equal(find(login.render(), "ScrollView").props.scrollEnabled, false);
  }
  const tree = login.render();
  const button = find(tree, "/GoogleButton");
  assert.equal(button.props.loading, true);
  button.props.onPress();
  assert.equal(signIns, 1);
  assert.ok(nodes(tree).some(node => node.type === "Text" && node.props.children === "Please try again."));
  const links = nodes(tree).filter(node => node.props?.accessibilityRole === "link");
  assert.equal(links.length, 2);
  links.forEach(link => link.props.onPress());
  assert.deepEqual(routes, ["/(screens)/settings-terms", "/(screens)/settings-privacy"]);
});
