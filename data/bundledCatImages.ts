import type { ImageSourcePropType } from "react-native";

// Static requires let Metro bundle these demo photos for offline use.
const images: Record<string, ImageSourcePropType> = {
  "mock:cat/angry1": require("./images/Cat_Image_Angry1.jpeg"),
  "mock:cat/angry2": require("./images/Cat_Image_Angry2.jpg"),
  "mock:cat/angry3": require("./images/Cat_Image_Angry3.png"),
  "mock:cat/fear1": require("./images/Cat_Image_Fearful1.jpg"),
  "mock:cat/fear2": require("./images/Cat_Image_Fearful2.jpg"),
  "mock:cat/fear3": require("./images/Cat_Image_Fearful3.jpg"),
  "mock:cat/happy1": require("./images/Cat_Image_Happy1.jpg"),
  "mock:cat/happy2": require("./images/Cat_Image_Happy2.jpg"),
  "mock:cat/happy3": require("./images/Cat_Image_Happy3.jpg"),
  "mock:cat/neutral1": require("./images/Cat_Image_Neutral1.jpg"),
  "mock:cat/neutral2": require("./images/Cat_Image_Neutral2.jpg"),
  "mock:cat/neutral3": require("./images/Cat_Image_Neutral3.jpg"),
};

export function getBundledCatImage(key?: string | null): ImageSourcePropType | undefined {
  if (!key) return undefined;
  const cameraEmotion = /^mock:camera\/(angry|happy|neutral|fear)$/.exec(key)?.[1];
  return images[cameraEmotion ? `mock:cat/${cameraEmotion}1` : key];
}
