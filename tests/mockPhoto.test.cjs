const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { mount } = require("./helpers/frontendHarness.cjs");

// Metro resolves static asset requires; Node only needs their verified local paths.
for (const extension of [".jpg", ".jpeg", ".png"]) {
  require.extensions[extension] = (module, filename) => {
    assert.ok(fs.statSync(filename).size > 0);
    module.exports = filename;
  };
}
const { getBundledCatImage } = require("../data/bundledCatImages.ts");
const { isDeviceImageUri } = require("../utils/mediaUri.ts");
const { initialCatDataState } = require("../data/initialAppData.ts");
const { selectAlbumCoverImage } = require("../context/catDataSelectors.ts");

const render = (imageUri, props = {}) => mount("components/common/MockPhoto.tsx", {
  props: { imageUri, size: 40, ...props },
}).render();

test("all bundled keys, camera aliases, profile photos, covers and saved fixtures render images", () => {
  for (const emotion of ["happy", "angry", "fear", "neutral"]) {
    for (let number = 1; number <= 3; number++) {
      const key = `mock:cat/${emotion}${number}`;
      const image = render(key);
      assert.equal(image.type, "Image");
      assert.equal(image.props.source, getBundledCatImage(key));
      assert.equal(image.props.testID, key);
    }
    assert.equal(render(`mock:camera/${emotion}`).props.source, getBundledCatImage(`mock:cat/${emotion}1`));
  }
  for (const cat of initialCatDataState.cats) {
    assert.equal(render(cat.photoUri).type, "Image");
    assert.equal(render(cat.coverUri).type, "Image");
  }
  for (const image of initialCatDataState.images) assert.equal(render(image.imageUri).type, "Image");
  const unknownImage = { ...initialCatDataState.images[0], id: "unknown-test", albumId: "unknown-cats" };
  const state = { ...initialCatDataState, images: [...initialCatDataState.images, unknownImage] };
  assert.equal(render(selectAlbumCoverImage(state, "unknown-cats").imageUri).type, "Image");
});

test("picked profile/cover URIs and remote photos remain supported without relaxing camera validation", () => {
  for (const uri of ["file:///photos/cat.jpg", "content://media/photos/1", "ph://photo-id",
    "assets-library://asset/cat.jpg", "blob:https://localhost/photo-id", "data:image/png;base64,Y2F0",
    "http://localhost/cat.jpg", "https://res.cloudinary.com/demo/image/upload/cat.jpg"]) {
    const image = render(uri);
    assert.equal(image.type, "Image");
    assert.equal(image.props.source.uri, uri);
  }
  assert.equal(isDeviceImageUri("https://example.com/cat.jpg"), false);
});

test("invalid sources preserve the placeholder, including inherited object keys", () => {
  for (const uri of [null, undefined, "", "mock:missing", "constructor", "__proto__", "not-a-uri", "https://", "javascript:alert(1)"]) {
    const icon = render(uri, { icon: "paw", label: "Cat photo placeholder" });
    assert.equal(icon.type, "Icon");
    assert.equal(icon.props.name, "paw");
    assert.equal(icon.props.accessibilityLabel, "Cat photo placeholder");
  }
});

test("cover defaults and caller-provided contain survive source resolution", () => {
  for (const uri of ["mock:cat/happy1", "file:///photo.jpg"]) {
    assert.equal(render(uri).props.resizeMode, "cover");
    const image = render(uri, { resizeMode: "contain", label: "Cat (Placeholder)" });
    assert.equal(image.props.resizeMode, "contain");
    assert.equal(image.props.accessibilityLabel, "Cat");
    assert.equal(image.props.style[1].width, "100%");
    assert.equal(image.props.style[1].height, "100%");
  }
});
