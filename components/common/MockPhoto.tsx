import React from "react";
import { Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { getBundledCatImage } from "@/data/bundledCatImages";
import { isDeviceImageUri, isRemoteImageUri } from "@/utils/mediaUri";

/** Displays bundled demo photos and selected images, or a placeholder for an invalid source. */
export default function MockPhoto({ imageUri, size, icon = "image-outline", color = colors.textMuted, label = "Photo", resizeMode = "cover", onLoad, onError }: {
  onLoad?: () => void;
  onError?: () => void;
  imageUri?: string | null;
  size: number;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  color?: string;
  label?: string;
  resizeMode?: "cover" | "contain";
}) {
  const source = getBundledCatImage(imageUri) ??
    (isDeviceImageUri(imageUri) || isRemoteImageUri(imageUri) ? { uri: imageUri } : undefined);
  if (source) {
    return <Image onLoad={onLoad} onError={onError} source={source} style={[StyleSheet.absoluteFillObject, { width: "100%", height: "100%" }]} resizeMode={resizeMode}
      testID={imageUri ?? undefined} accessible accessibilityRole="image"
      accessibilityLabel={label.replace(/\s*\(?placeholder\)?/gi, "").trim() || "Cat photo"} />;
  }
  return <Ionicons name={icon} size={size} color={color}
    testID={imageUri ?? undefined} accessible accessibilityRole="image" accessibilityLabel={label} />;
}
