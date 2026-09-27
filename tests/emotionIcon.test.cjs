const test = require("node:test");
const assert = require("node:assert/strict");
const { mount, find } = require("./helpers/frontendHarness.cjs");

function render(emotion, size = 44) {
  return mount("components/common/EmotionIcon.tsx", {
    props: { emotion, size },
    dependencies: {
      "react-native": { View: "View", Image: "Image", StyleSheet: { create: (styles) => styles } },
      ...Object.fromEntries(["happy", "angry", "fearful", "neutral"].map((key) =>
        [`../images/emotion_${key}.png`, key])),
    },
  }).render();
}

test("all emotion assets resolve with casing and the existing fear key", () => {
  for (const [value, asset] of [["Happy", "happy"], ["HAPPY", "happy"], ["angry", "angry"],
    ["Fearful", "fearful"], ["fear", "fearful"], [" NEUTRAL ", "neutral"]]) {
    const image = find(render(value), "Image");
    assert.equal(image.props.source, asset);
    assert.equal(image.props.resizeMode, "contain");
    assert.equal(image.props.style.tintColor, undefined);
  }
});

test("emotion icons retain circular square bounds at every display size", () => {
  for (const size of [22, 30, 32, 34, 44, 56]) {
    const tree = render("happy", size);
    const style = Object.assign({}, ...tree.props.style);
    assert.equal(style.width, size);
    assert.equal(style.height, size);
    assert.equal(style.borderRadius, size / 2);
    assert.equal(style.overflow, "hidden");
    assert.equal(tree.props.accessibilityLabel, "Happy");
  }
});

test("invalid emotion values use the unavailable fallback, never another emotion", () => {
  for (const value of [undefined, null, "", "unknown", "constructor", "__proto__", 42, {}]) {
    const tree = render(value);
    assert.equal(find(tree, "Image"), undefined);
    assert.equal(find(tree, "Icon").props.name, "help-outline");
    assert.equal(tree.props.accessibilityLabel, "Emotion unavailable");
  }
});
