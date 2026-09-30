const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mount, nodes, find, modal } = require("./helpers/frontendHarness.cjs");
const settingsFile = "app/(screens)/(tabs)/settings.tsx";
const feedbackFile = "app/(screens)/settings-feedback.tsx";
const profile = { firstName: "Demo", lastName: "User", email: "demo.user@feeline.app", profileImageUrl: null };
const auth = (signOut = async () => {}, value = profile) => ({ "@/context/AuthContext": { useAuth: () => ({ profile: value, signOut }) } });
const row = (tree, label) => nodes(tree).find((node) => node.props?.label === label);

test("Settings uses session account data, keeps the five menu destinations, and cancels logout without side effects", () => {
  const routes = [];
  let calls = 0;
  const screen = mount(settingsFile, { dependencies: auth(async () => { calls++; }), router: { push: (route) => routes.push(route) } });
  const tree = screen.render();
  assert.ok(nodes(tree).some((node) => node.props?.children === profile.email));
  assert.ok(nodes(tree).some((node) => node.props?.children === "Demo User"));
  for (const name of ["About", "Give us Feedback", "Privacy Policy", "Terms and Conditions"]) row(tree, name).props.onPress();
  assert.deepEqual(routes, ["/settings-about", "/settings-feedback", "/settings-privacy", "/settings-terms"]);
  row(tree, "Log out").props.onPress();
  assert.equal(calls, 0);
  assert.equal(modal(screen.render(), "Log out?").props.visible, true);
  modal(screen.render(), "Log out?").props.onCancel();
  assert.equal(modal(screen.render(), "Log out?").props.visible, false);
  assert.equal(calls, 0);
  const missing = mount(settingsFile, { dependencies: auth(undefined, null) }).render();
  assert.ok(nodes(missing).some((node) => node.props?.children === "No email available"));
});

test("confirmed logout waits for the existing session clear, prevents duplicate taps, and allows retry after failure", async () => {
  let finish;
  let calls = 0;
  const screen = mount(settingsFile, { dependencies: auth(() => { calls++; return new Promise((resolve, reject) => { finish = { resolve, reject }; }); }) });
  row(screen.render(), "Log out").props.onPress();
  const confirmation = modal(screen.render(), "Log out?");
  const pending = confirmation.props.onConfirm();
  confirmation.props.onConfirm();
  assert.equal(calls, 1);
  assert.equal(modal(screen.render(), "Log out?").props.busy, true);
  modal(screen.render(), "Log out?").props.onCancel();
  assert.equal(modal(screen.render(), "Log out?").props.visible, true);
  finish.reject(new Error("test"));
  await pending;
  assert.equal(modal(screen.render(), "Log out?").props.busy, false);
  assert.equal(modal(screen.render(), "Log out?").props.message, "Could not log out. Please try again.");
  const retry = modal(screen.render(), "Log out?").props.onConfirm();
  finish.resolve();
  await retry;
  assert.equal(calls, 2);
  assert.equal(modal(screen.render(), "Log out?").props.visible, false);
});

test("AuthProvider restores the mock session and clears it on logout; next restoration stays signed out", async () => {
  let token = "mock-session-token";
  let clears = 0;
  const dependencies = { "../services/api": {
    getToken: async () => token, saveToken: async (value) => { token = value; },
    clearToken: async () => { clears++; token = null; },
  } };
  const provider = mount("context/AuthContext.tsx", { dependencies });
  assert.equal(provider.render().props.value.isLoading, true);
  await new Promise(setImmediate);
  const session = provider.render().props.value;
  assert.equal(session.profile.email, profile.email);
  await session.signOut();
  assert.equal(clears, 1);
  assert.equal(token, null);
  assert.equal(provider.render().props.value.profile, null);
  const restored = mount("context/AuthContext.tsx", { dependencies });
  restored.render();
  await new Promise(setImmediate);
  assert.equal(restored.render().props.value.profile, null);
});

test("Feedback validates every required field and basic email, preserves input, then shows truthful mock success", () => {
  const routes = [];
  const screen = mount(feedbackFile, { router: { dismissTo: (route) => routes.push(route) } });
  const field = (label) => row(screen.render(), label);
  field("Submit").props.onPress();
  for (const label of ["Title", "Email", "Subject", "Message"]) assert.ok(field(label).props.error);
  field("Title").props.onChangeText("  Calendar feedback  ");
  field("Subject").props.onChangeText("Layout");
  field("Message").props.onChangeText("A mock-only test message.");
  for (const email of ["x@", "@example.com", "x y@example.com", "x@example", "x@@example.com"]) {
    field("Email").props.onChangeText(email);
    field("Submit").props.onPress();
    assert.equal(field("Email").props.error, "Please enter a valid email address.");
    assert.equal(modal(screen.render(), "Thank you").props.visible, false);
    assert.equal(field("Message").props.value, "A mock-only test message.");
  }
  field("Email").props.onChangeText(" demo@example.com ");
  const submit = field("Submit");
  submit.props.onPress();
  submit.props.onPress();
  const success = modal(screen.render(), "Thank you for your Feedback!");
  assert.equal(success.props.visible, true);
  assert.match(success.props.message, /not sent or saved/);
  assert.equal(field("Submit").props.disabled, true);
  success.props.onConfirm();
  assert.deepEqual(routes, ["/settings"]);
});

test("About and Feedback have a safe internal Settings return; legal content remains structured", () => {
  for (const file of ["app/(screens)/settings-about.tsx", feedbackFile]) {
    const routes = [];
    const screen = mount(file, { router: { dismissTo: (route) => routes.push(route) } });
    find(screen.render(), "/DetailScreenHeader").props.onBack();
    assert.deepEqual(routes, ["/settings"]);
  }
  const about = JSON.stringify(mount("app/(screens)/settings-about.tsx").render());
  assert.match(about, /observable emotional cues/);
  assert.match(about, /does not perform real AI analysis/);
  for (const [file, count] of [["settings-privacy", 7], ["settings-terms", 9]]) {
    const tree = mount(`app/(screens)/${file}.tsx`).render();
    assert.equal(nodes(tree).filter((node) => node.type === "@/components/common/PolicySection").length, count);
    assert.ok(find(tree, "/LegalScreen"));
  }
});

test("shared confirmation disables cancellation and shows progress only when busy", () => {
  for (const busy of [false, true]) {
    let cancelled = 0;
    const tree = mount("components/common/ConfirmModal.tsx", { props: { visible: true, title: "Log out?", busy,
      destructive: true, onConfirm() {}, onCancel: () => { cancelled++; } } }).render();
    assert.equal(row(tree, "Cancel").props.disabled, busy);
    assert.equal(row(tree, "Confirm").props.loading, busy);
    tree.props.onClose();
    assert.equal(cancelled, busy ? 0 : 1);
  }
});
