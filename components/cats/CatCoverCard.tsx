import React, { useRef } from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import MockPhoto from "@/components/common/MockPhoto";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface CatCoverCardProps {
  name: string;
  coverUri?: string | null;
  variant?: "tile" | "bar";
  onPress?: () => void;
  /** Triggers album management (rename/delete). Omit to disable long-press
   * for this card, e.g. the system "Unknown Cats" album. */
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
}

/** Photo-background card with a name overlay. Used for both the Cat Album
 * grid ("tile") and the My Cats list ("bar"). */
export default function CatCoverCard({ name, coverUri, variant = "tile", onPress, onLongPress, style, subtitle }: CatCoverCardProps) {
  const isBar = variant === "bar";
  const longPressed = useRef(false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${name}, ${subtitle}` : name}
      accessibilityHint={onLongPress ? "Open album. Hold for Rename and Delete." : undefined}
      onPressIn={() => { longPressed.current = false; }}
      onPress={() => { if (!longPressed.current) onPress?.(); }}
      onLongPress={onLongPress ? () => { longPressed.current = true; onLongPress(); } : undefined}
      style={[styles.card, isBar ? styles.bar : styles.tile, style]}
    >
      <View style={styles.photoPlaceholder}>
        <MockPhoto imageUri={coverUri} icon="paw" size={isBar ? 30 : 24} />
      </View>
      <View style={styles.overlay} />
      <Text style={[styles.name, isBar && styles.nameBar]} numberOfLines={2}>
        {name}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, overflow: "hidden", justifyContent: "flex-end", padding: spacing.sm },
  tile: { aspectRatio: 1 },
  bar: { width: "100%", minHeight: 140, marginBottom: spacing.md },
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
    height: "65%",
    backgroundColor: colors.photoScrim,
  },
  name: { ...typography.bodyMedium, color: colors.white },
  nameBar: { ...typography.subheading, color: colors.white },
  subtitle: { ...typography.caption, color: colors.white, marginTop: spacing.xxs },
});
