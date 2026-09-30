import React from "react";
import { Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { getBundledCatImage } from "@/data/bundledCatImages";
import { isDeviceImageUri } from "@/utils/mediaUri";

/** Bundled demo photos; missing references retain the existing placeholder. */
export default function MockPhoto({ imageUri, size, icon = "image-outline", color = colors.textMuted, label = "Photo (Placeholder)" }: {
  imageUri?: string | null;
  size: number;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  color?: string;
  label?: string;
}) {
  const source = getBundledCatImage(imageUri) ?? (isDeviceImageUri(imageUri) ? { uri: imageUri } : undefined);
  if (source) return <Image source={source} resizeMode="cover"
    style={[StyleSheet.absoluteFillObject, { width: "100%", height: "100%" }]}
    testID={imageUri ?? undefined} accessible accessibilityRole="image"
    accessibilityLabel={label.replace(/\s*\(?placeholder\)?/ig, "").trim() || "Mock cat photo"} />;
  return <Ionicons name={icon} size={size} color={color}
    testID={imageUri ?? undefined} accessible accessibilityRole="image" accessibilityLabel={label} />;
}
