import type { ImageSourcePropType } from "react-native";

export type BackgroundModule = "auth" | "settings" | "camera" | "calendar" | "album" | "catProfile" | "gallery";
export type ModuleBackgroundMode = "image" | "color";

const BG3 = require("../components/images/bg3.png");

/** Set false to restore colors.background (#FFF7E9) across all modules. */
export const ENABLE_MODULE_BACKGROUNDS = true;

/** Set an individual mode to "color" to disable only that module's artwork. */
export const moduleBackgroundConfig: Record<BackgroundModule, {
  mode: ModuleBackgroundMode;
  image: ImageSourcePropType;
  /** Image-only opacity, clamped to 0..1 by the renderer. */
  opacity: number;
}> = {
  auth: { mode: "image", image: require("../components/images/bg1.png"), opacity: 1 },
  settings: { mode: "image", image: BG3, opacity: 0.6 },
  camera: { mode: "image", image: BG3, opacity: 0.6 },
  calendar: { mode: "color", image: BG3, opacity: 0 },
  album: { mode: "image", image: BG3, opacity: 0.55 },
  catProfile: { mode: "image", image: BG3, opacity: 0.7 },
  gallery: { mode: "image", image: BG3, opacity: 0.55 },
};
