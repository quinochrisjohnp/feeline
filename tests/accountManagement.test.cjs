const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mount, nodes, modal } = require("./helpers/frontendHarness.cjs");
const file = "app/(screens)/settings-account.tsx";
const profile = { firstName: "Demo", lastName: "User", email: "demo@example.com", profileImageUrl: "https://example.com/avatar.jpg" };
const row = (tree, label) => nodes(tree).find(n => n.props?.label === label);
function setup(signOut) { return mount(file, { dependencies: { "@/context/AuthContext": { useAuth: () => ({ profile, signOut }) } } }); }
test("Account Management shows account details and explicitly identifies deletion as a preview", () => {
  const screen = setup(async () => {}); const tree = screen.render();
  for (const text of ["Demo User", profile.email, "Google"]) assert.ok(nodes(tree).some(n => n.props?.children === text));
  assert.ok(nodes(tree).some(n => n.props?.source?.uri === profile.profileImageUrl));
  row(tree, "Delete Account").props.onPress();
  assert.match(modal(screen.render(), "Delete Account?").props.message, /does not delete any data/);
  modal(screen.render(), "Delete Account?").props.onCancel();
  assert.equal(modal(screen.render(), "Delete Account?").props.visible, false);
});
test("Delete preview requires exact phrase, resets cancellation, and signs out once without deletion", async () => {
  let calls = 0, finish;
  const screen = setup(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
  row(screen.render(), "Delete Account").props.onPress();
  const field = () => row(screen.render(), "Type DELETE ACCOUNT to confirm");
  for (const input of ["", "delete account", "DELETE", "DELETE ACCOUNT "]) {
    field().props.onChangeText(input);
    const dialog = modal(screen.render(), "Delete Account?");
    assert.equal(dialog.props.actions.props.second.disabled, true);
    await dialog.props.onConfirm();
  }
  assert.equal(calls, 0);
  field().props.onChangeText("DELETE ACCOUNT");
  modal(screen.render(), "Delete Account?").props.onCancel();
  assert.equal(field().props.value, "");
  row(screen.render(), "Delete Account").props.onPress();
  field().props.onChangeText("DELETE ACCOUNT");
  const dialog = modal(screen.render(), "Delete Account?");
  assert.equal(dialog.props.actions.props.second.disabled, false);
  const pending = dialog.props.onConfirm(); dialog.props.onConfirm();
  assert.equal(calls, 1);
  modal(screen.render(), "Delete Account?").props.onCancel();
  assert.equal(modal(screen.render(), "Delete Account?").props.visible, true);
  finish(); await pending;
  assert.equal(modal(screen.render(), "Delete Account?").props.visible, false);
});
