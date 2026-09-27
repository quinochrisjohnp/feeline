import React from "react";
import { Image, StyleSheet } from "react-native";
import { dimensions } from "@/constants/theme";

/**
 * The FeELINE in-app logo mark, shown on Splash and Login.
 * Previously rendered as a 2x2 colored emotion grid; now renders the
 * provided brand logo asset (components/images/logo.png). Kept this
 * component's name/export shape unchanged so BrandedSplash.tsx and
 * login.tsx need no import changes.
 */
export default function EmotionLogoGrid() {
  return (
    <Image
      source={require("../images/logo.png")}
      style={styles.logo}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel="FeELINE logo"
    />
  );
}

const styles = StyleSheet.create({
  logo: { width: dimensions.logo, height: dimensions.logo },
});