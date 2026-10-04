import React, { useState } from "react";
import { Image, Keyboard, StyleSheet, useWindowDimensions, View } from "react-native";
import { colors } from "@/constants/theme";
import { ENABLE_MODULE_BACKGROUNDS, moduleBackgroundConfig, type BackgroundModule } from "@/constants/moduleBackgrounds";

/** Absolute, centered contain layer: never crops artwork or contributes to content height. */
export default function ModuleBackground({ module }: { module: BackgroundModule }) {
  const config = moduleBackgroundConfig[module];
  const window = useWindowDimensions();
  const [viewport, setViewport] = useState({ width: window.width, height: window.height });
  // Native resolves Metro asset IDs; Metro web supplies the source metadata directly.
  const asset = typeof Image.resolveAssetSource === "function"
    ? Image.resolveAssetSource(config.image)
    : typeof config.image === "object" && !Array.isArray(config.image) ? config.image : null;
  const intrinsicWidth = asset?.width ?? 0;
  const intrinsicHeight = asset?.height ?? 0;
  const scale = intrinsicWidth > 0 && intrinsicHeight > 0
    ? Math.min(viewport.width / intrinsicWidth, viewport.height / intrinsicHeight) : 0;
  const width = intrinsicWidth * scale;
  const height = intrinsicHeight * scale;
  return (
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={styles.background}
      onLayout={({ nativeEvent: { layout } }) => {
        // Android adjustResize may shrink the root for the keyboard. Keep the
        // background anchored while foreground keyboard avoidance handles inputs.
        if (Keyboard.isVisible() || layout.width <= 0 || layout.height <= 0) return;
        setViewport((previous) => previous.width === layout.width && previous.height === layout.height
          ? previous : { width: layout.width, height: layout.height });
      }}>
      {ENABLE_MODULE_BACKGROUNDS && config.mode === "image" && scale > 0 ? (
        <Image source={config.image} resizeMode="contain" testID={`module-background-${module}`}
          style={{ position: "absolute", width, height, left: (viewport.width - width) / 2, top: (viewport.height - height) / 2 }}
          accessible={false} importantForAccessibility="no" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  background: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background },
});
