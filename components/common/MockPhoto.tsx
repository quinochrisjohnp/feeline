import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

/** Mock keys deliberately render the existing placeholder, without loading media. */
export default function MockPhoto({ imageUri, size, icon = "image-outline", color = colors.textMuted, label = "Photo (Placeholder)" }: {
  imageUri?: string | null;
  size: number;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  color?: string;
  label?: string;
}) {
  return <Ionicons name={icon} size={size} color={color}
    testID={imageUri ?? undefined} accessible accessibilityRole="image" accessibilityLabel={label} />;
}
