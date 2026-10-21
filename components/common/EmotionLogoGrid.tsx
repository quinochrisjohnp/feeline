import React from "react";
import { Image } from "react-native";
import { dimensions } from "@/constants/theme";

/** Complete logo, including the FeELINE name, shared by Splash and Login. */
export default function EmotionLogoGrid({ size = dimensions.logo }: { size?: number }) {
  return (
    <Image source={require("../images/logo-no-bg.png")}
      style={{ width: size, height: size, aspectRatio: 1 }} resizeMode="contain"
      accessible accessibilityRole="image" accessibilityLabel="FeELINE logo" />
  );
}
