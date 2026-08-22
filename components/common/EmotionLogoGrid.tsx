import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/constants/theme";

const CELLS = [
  { key: "happy", emoji: "😻", color: colors.emotion.happy },
  { key: "fear", emoji: "😰", color: colors.emotion.fear },
  { key: "neutral", emoji: "😑", color: colors.emotion.neutral },
  { key: "angry", emoji: "😾", color: colors.emotion.angry },
];

/** The 2x2 emotion-color logo mark used on the splash/welcome screens. */
export default function EmotionLogoGrid() {
  return (
    <View style={styles.grid}>
      {CELLS.map((cell) => (
        <View key={cell.key} style={[styles.cell, { backgroundColor: cell.color }]}>
          <Text style={styles.emoji}>{cell.emoji}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: 110,
    height: 110,
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: radii.md,
    overflow: "hidden",
  },
  cell: { width: 55, height: 55, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 26 },
});