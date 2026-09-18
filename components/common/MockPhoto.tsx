import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

/** Mock keys deliberately render the existing placeholder, without loading media. */
export default function MockPhoto({ imageUri, size, icon = "image-outline" }: {
  imageUri?: string | null;
  size: number;
  icon?: "image-outline" | "paw";
}) {
  return <Ionicons name={icon} size={size} color={colors.textMuted}
    testID={imageUri ?? undefined} accessibilityLabel="Photo (Placeholder)" />;
}
