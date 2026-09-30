import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, dimensions, radii, typography } from "@/constants/theme";

import { EMOTIONS, EmotionKey } from "@/types/models";

const CELLS: EmotionKey[] = ["happy", "fear", "neutral", "angry"];

/** The 2x2 emotion-color logo mark used on the splash/welcome screens. */
export default function EmotionLogoGrid() {
  return (
    <View style={styles.grid} accessible accessibilityRole="image" accessibilityLabel="FeELINE: Happy, Fearful, Neutral and Angry">
      {CELLS.map((cell) => (
        <View key={cell} style={[styles.cell, { backgroundColor: colors.emotion[cell] }]}>
          <Text style={styles.emoji}>{EMOTIONS[cell].emoji}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: dimensions.logo,
    height: dimensions.logo,
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: radii.md,
    overflow: "hidden",
  },
  cell: { width: dimensions.logo / 2, height: dimensions.logo / 2, alignItems: "center", justifyContent: "center" },
  emoji: typography.logoEmoji,
});