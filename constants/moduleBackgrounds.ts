import type { ImageSourcePropType } from "react-native";

export type BackgroundModule = "auth" | "settings" | "camera" | "calendar" | "album" | "catProfile";
export type ModuleBackgroundMode = "image" | "color";

const BG1 = require("../components/images/bg1.png");
const BG2 = require("../components/images/bg2.png");
const BG3 = require("../components/images/bg3.png");

/** Set false to restore colors.background (#FFF7E9) across all modules. */
export const ENABLE_MODULE_BACKGROUNDS = true;

/** Set an individual mode to "color" to disable only that module's artwork. */
export const moduleBackgroundConfig: Record<BackgroundModule, {
  mode: ModuleBackgroundMode;
  image: ImageSourcePropType;
}> = {
  auth: { mode: "image", image: BG1 },
  settings: { mode: "image", image: BG1 },
  camera: { mode: "image", image: BG2 },
  calendar: { mode: "image", image: BG2 },
  album: { mode: "image", image: BG3 },
  catProfile: { mode: "image", image: BG3 },
};
