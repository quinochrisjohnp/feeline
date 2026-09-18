import React from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Cat } from "@/types/models";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface CatCoverCardProps {
  cat: Cat;
  variant?: "tile" | "bar";
  onPress?: () => void;
  /** Triggers album management (rename/delete). Omit to disable long-press
   * for this card, e.g. the system "Unknown Cats" album. */
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Photo-background card with a name overlay. Used for both the Cat Album
 * grid ("tile") and the My Cats list ("bar"). */
export default function CatCoverCard({ cat, variant = "tile", onPress, onLongPress, style }: CatCoverCardProps) {
  const isBar = variant === "bar";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.card, isBar ? styles.bar : styles.tile, style]}
    >
      <View style={styles.photoPlaceholder}>
        <Ionicons name="paw" size={isBar ? 30 : 24} color={colors.textMuted} />
      </View>
      <View style={styles.overlay} />
      <Text style={[styles.name, isBar && styles.nameBar]} numberOfLines={1}>
        {cat.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, overflow: "hidden", justifyContent: "flex-end", padding: spacing.sm },
  tile: { aspectRatio: 1 },
  bar: { width: "100%", height: 140, marginBottom: spacing.md },
  photoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
    backgroundColor: "rgba(36,26,18,0.4)",
  },
  name: { ...typography.bodyMedium, color: colors.white },
  nameBar: { ...typography.subheading, color: colors.white },
});