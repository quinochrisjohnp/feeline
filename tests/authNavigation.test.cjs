// Exercise screen configuration and callbacks without native UI or new dependencies.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { getRoutes } = require("expo-router/build/getRoutes");

function loadScreen(file, overrides = {}) {
  const mocks = {
    react: { ...React, useCallback: (fn) => fn },
    "react-native": {
      StyleSheet: { create: (styles) => styles, flatten: (styles) => styles },
      BackHandler: { addEventListener: () => ({ remove() {} }) },
      View: "View", Text: "Text", ScrollView: "ScrollView", TouchableOpacity: "TouchableOpacity",
    },
    "expo-router": { Stack: Object.assign(() => null, { Screen: "Screen", Protected: "Protected" }), useFocusEffect() {} },
    "@/constants/theme": { colors: { emotion: {} }, spacing: {}, typography: {}, dimensions: {} },
    ...overrides,
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require: (id) => {
      if (id in mocks) return mocks[id];
      if (id === "react/jsx-runtime") return require(id);
      if (id.includes("components/") || id.startsWith("./")) return { __esModule: true, default: id };
      throw new Error("Unexpected dependency: " + id);
    },
  }, { filename: file });
  return exports.default;
}

function children(node) {
  return React.Children.toArray(node?.props?.children);
}

function descendants(node) {
  return [node, ...children(node).flatMap(descendants)];
}

test("restoration shows branding, then root redirects to login or Camera", () => {
  for (const [isLoading, profile, expected] of [
    [true, null, null], [false, null, "/(screens)/(auth)/login"],
    [false, { profileId: "demo" }, "/(screens)/(tabs)/camera"],
  ]) {
    const Index = loadScreen("app/index.tsx", {
      "@/context/AuthContext": { useAuth: () => ({ isLoading, profile }) },
      "expo-router": { Redirect: "Redirect" },
    });
    const screen = Index();
    if (isLoading) assert.equal(screen.type, "@/components/common/BrandedSplash");
    else assert.equal(screen.props.href, expected);
  }
});

test("every discovered app route has the appropriate guard; legal pages remain public", () => {
  const files = fs.readdirSync(path.join(__dirname, "../app"), { recursive: true })
    .filter((file) => file.endsWith(".tsx")).map((file) => "./" + file.replaceAll("\\", "/"));
  const context = () => ({ default: () => null });
  context.keys = () => files;
  const routes = getRoutes(context, { ignoreEntryPoints: true });
  const discovered = routes.children.find((route) => route.route === "(screens)").children.map((route) => route.route);
  for (const profile of [null, { profileId: "demo" }, null]) {
    const Layout = loadScreen("app/(screens)/_layout.tsx", {
      "@/context/AuthContext": { useAuth: () => ({ isLoading: false, profile }) },
    });
    const declarations = children(Layout());
    const available = declarations.flatMap((node) =>
      node.type === "Protected" ? (node.props.guard ? children(node) : []) : [node]
    ).map((node) => node.props.name);
    const all = declarations.flatMap((node) => node.type === "Protected" ? children(node) : [node])
      .map((node) => node.props.name);
    assert.deepEqual([...all].sort(), [...discovered].sort());
    assert.ok(available.includes("settings-terms"));
    assert.ok(available.includes("settings-privacy"));
    assert.equal(available.includes("(auth)/login"), !profile);
    for (const route of discovered.filter((name) => !["settings-terms", "settings-privacy", "(auth)/login"].includes(name))) {
      assert.equal(available.includes(route), !!profile, route);
    }
    assert.equal(available[0], profile ? "(tabs)" : "(auth)/login");
  }
});

test("no protected screen is mounted while the session is restoring", () => {
  const Layout = loadScreen("app/(screens)/_layout.tsx", {
    "@/context/AuthContext": { useAuth: () => ({ isLoading: true, profile: null }) },
  });
  assert.equal(Layout().type, "@/components/common/BrandedSplash");
});

test("login calls the existing mock sign-in and each legal link has its own internal destination", () => {
  const pushed = [];
  const signIn = () => {};
  const Login = loadScreen("app/(screens)/(auth)/login.tsx", {
    "@/context/AuthContext": { useAuth: () => ({ signIn, isSigningIn: true, error: null }) },
    "expo-router": { useRouter: () => ({ push: (route) => pushed.push(route) }) },
  });
  const tree = descendants(Login());
  const button = tree.find((node) => node.type === "@/components/common/GoogleButton");
  assert.equal(button.props.onPress, signIn);
  assert.equal(button.props.loading, true);
  const links = tree.filter((node) => node.props?.accessibilityRole === "link");
  assert.equal(links.length, 2);
  links.forEach((node) => node.props.onPress());
  assert.deepEqual(pushed, ["/(screens)/settings-terms", "/(screens)/settings-privacy"]);
});

test("legal back uses history, with login/settings fallbacks for direct entry", () => {
  for (const profile of [null, { profileId: "demo" }]) {
    for (const canGoBack of [false, true]) {
      const calls = [];
      const Legal = loadScreen("components/common/LegalScreen.tsx", {
        "@/context/AuthContext": { useAuth: () => ({ profile }) },
        "expo-router": {
          useFocusEffect() {},
          useRouter: () => ({
            canGoBack: () => canGoBack,
            back: () => calls.push("back"),
            replace: (route) => calls.push(route),
          }),
        },
      });
      const header = descendants(Legal({ title: "Legal", children: null }))
        .find((node) => node.type === "./DetailScreenHeader");
      header.props.onBack();
      assert.deepEqual(calls, [canGoBack ? "back" : profile ? "/(screens)/(tabs)/settings" : "/(screens)/(auth)/login"]);
    }
  }
});

test("five tabs keep their order, expose selection, switch routes, and hide for the profile", () => {
  const Tabs = Object.assign(() => null, { Screen: "TabScreen" });
  const Layout = loadScreen("app/(screens)/(tabs)/_layout.tsx", { "expo-router": { Tabs } });
  const layout = Layout();
  assert.equal(layout.props.initialRouteName, "camera");
  const names = children(layout).map((node) => node.props.name);
  assert.deepEqual(names, ["camera", "album", "calendar", "status", "settings"]);
  const Bar = loadScreen("components/navigation/FloatingTabBar.tsx", {
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 20 }) },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "@/constants/theme": { colors: {}, dimensions: {}, interaction: {}, navigation: {},
      radii: {}, shadows: {}, spacing: {} },
  });
  const navigated = [];
  const state = { index: 0, routes: names.map((name) => ({ name, key: name })) };
  const descriptors = Object.fromEntries(names.map((name) => [name, { options: {} }]));
  const props = { state, descriptors, navigation: {
    emit: () => ({ defaultPrevented: false }), navigate: (route) => navigated.push(route),
  } };
  const buttons = descendants(Bar(props)).filter((node) => node.props?.accessibilityRole === "tab");
  assert.equal(buttons.length, 5);
  assert.deepEqual(buttons.map((node) => node.props.accessibilityState.selected), [true, false, false, false, false]);
  buttons[1].props.onPress();
  assert.deepEqual(navigated, ["album"]);
  state.index = 3;
  descriptors.status.options.tabBarStyle = { display: "none" };
  assert.equal(Bar(props), null);
  descriptors.status.options.tabBarStyle = undefined;
  assert.ok(Bar(props));
});
