const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { mount, find, nodes, store } = require("./helpers/frontendHarness.cjs");

function session(os, secureStore) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(require.resolve("../services/api.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, process: { env: { EXPO_PUBLIC_API_URL: "unused" } },
    require: (id) => id === "react-native" ? { Platform: { OS: os } } : secureStore,
    fetch: () => { throw new Error("Session helpers must never call the network"); } });
  return exports;
}

test("web mock session uses memory only, clears on logout, and resets with a fresh module", async () => {
  const unavailable = new Proxy({}, { get() { throw new Error("Native storage called on web"); } });
  const api = session("web", unavailable);
  assert.equal(await api.getToken(), null);
  await api.saveToken("mock-session-token");
  assert.equal(await api.getToken(), "mock-session-token");
  assert.equal(await session("web", unavailable).getToken(), null);
  await api.clearToken();
  assert.equal(await api.getToken(), null);
});

test("native mock session preserves the existing SecureStore key and operations", async () => {
  for (const os of ["android", "ios"]) {
    const calls = [];
    const api = session(os, {
      setItemAsync: async (...args) => calls.push(["set", ...args]),
      getItemAsync: async (key) => { calls.push(["get", key]); return "mock-session-token"; },
      deleteItemAsync: async (key) => calls.push(["delete", key]),
    });
    await api.saveToken("mock-session-token");
    assert.equal(await api.getToken(), "mock-session-token");
    await api.clearToken();
    assert.deepEqual(calls, [["set", "feeline_auth_token", "mock-session-token"], ["get", "feeline_auth_token"], ["delete", "feeline_auth_token"]]);
  }
});

test("empty album collection offers recovery without inventing domain records", () => {
  const context = store();
  const routes = [];
  const screen = mount("app/(screens)/(tabs)/album.tsx", {
    context: () => ({ ...context(), state: { cats: [], albums: [], images: [], detectionRecords: [] } }),
    router: { navigate: (route) => routes.push(route) },
  });
  const empty = find(screen.render(), "/EmptyState");
  assert.equal(empty.props.title, "No albums available");
  empty.props.onAction();
  assert.deepEqual(routes, ["/status"]);
});

test("malformed photo and album route identities render recoverable missing states", () => {
  const context = store();
  for (const [file, key] of [["album-photo", "imageId"], ["album-folder", "albumId"]]) {
    for (const value of [undefined, ["bad", "ids"], "missing"]) {
      const screen = mount(`app/(screens)/${file}.tsx`, { context, params: { [key]: value } });
      assert.ok(find(screen.render(), "/EmptyState"));
    }
  }
});

test("collapsed calendar disables the hidden month buttons and exposes only its week to assistive technology", () => {
  const screen = mount("app/(screens)/(tabs)/calendar.tsx", { context: store() });
  find(screen.render(), "ScrollView").props.onScroll({ nativeEvent: { contentOffset: { y: 600 } } });
  const tree = screen.render();
  assert.ok(nodes(tree).some((node) => node.props?.["aria-hidden"] === true));
  const days = nodes(tree).filter((node) => node.type === "@/components/calendar/CalendarDay");
  assert.equal(days.length, 42);
  assert.ok(days.every((day) => day.props.disabled));
  assert.ok(find(tree, "/CompactWeekStrip"));
});
