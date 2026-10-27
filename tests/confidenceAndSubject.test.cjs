const test = require("node:test");
const assert = require("node:assert/strict");
const { mount, nodes } = require("./helpers/frontendHarness.cjs");
test("accepted result caution appears strictly below 50 without hiding recommendations", () => {
 for (const embedded of [true, false]) {
  for (const confidence of [0, 20, 49, 49.9, 50, 90, undefined, NaN]) {
   const tree = mount("components/camera/EmotionResultCard.tsx", {
    props: { embedded, emotionKey: "happy", confidence, recommendations: ["Existing recommendation"] },
    dependencies: { "@/constants/theme": { colors: {}, dimensions: {}, radii: {}, shadows: {}, spacing: {}, typography: { body: { lineHeight: 24 } } }, "@/utils/emotion": require("../utils/emotion.ts"), "@/types/models": require("../types/models.ts") },
   }).render();
   assert.equal(nodes(tree).some(n => n.props?.testID === "confidence-caution"), Number.isFinite(confidence) && confidence < 50);
   assert.ok(nodes(tree).some(n => n.props?.children === "Existing recommendation"));
  }
 }
});
test("Subject expands inline, selects an option and collapses on a second tap", () => {
 const screen = mount("app/(screens)/settings-feedback.tsx");
 const subject = () => nodes(screen.render()).find(n => n.props?.label === "Subject");
 const choices = () => nodes(screen.render()).filter(n => n.type === "Pressable");
 assert.equal(subject().props.accessibilityState.expanded, false);
 subject().props.onSelect();
 assert.equal(subject().props.accessibilityState.expanded, true);
 assert.equal(nodes(screen.render()).some(n => n.type === "Modal"), false);
 assert.equal(choices().length, 5);
 choices()[2].props.onPress();
 assert.equal(subject().props.value, "Emotion Detection Concern");
 assert.equal(subject().props.accessibilityState.expanded, false);
 subject().props.onSelect();
 subject().props.onSelect();
 assert.equal(subject().props.accessibilityState.expanded, false);
});
