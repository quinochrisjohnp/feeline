import React, { useRef } from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MockPhoto from "@/components/common/MockPhoto";
import { colors, fonts, radii, shadows, spacing, typography } from "@/constants/theme";

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
 * grid ("tile") and the My Cats list ("bar"). Shadow lives on an outer,
 * unclipped wrapper; the rounded photo surface is a separate inner view —
 * RN cannot both clip (overflow: hidden) and cast a shadow on one view. */
export default function CatCoverCard({ name, coverUri, variant = "tile", onPress, onLongPress, style, subtitle }: CatCoverCardProps) {
  const isBar = variant === "bar";
  const longPressed = useRef(false);

  return (
    <View style={[styles.shadowWrap, isBar ? styles.bar : styles.tile, style]}>
      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${name}, ${subtitle}` : name}
        accessibilityHint={onLongPress ? "Open album. Hold for Rename and Delete." : undefined}
        onPressIn={() => { longPressed.current = false; }}
        onPress={() => { if (!longPressed.current) onPress?.(); }}
        onLongPress={onLongPress ? () => { longPressed.current = true; onLongPress(); } : undefined}
        style={styles.card}
      >
        <View style={styles.photoPlaceholder}>
          <MockPhoto imageUri={coverUri} icon="paw" size={isBar ? 30 : 24} />
        </View>
        <LinearGradient
          colors={["transparent", colors.photoScrim]}
          locations={[0, 1]}
          style={styles.overlay}
          pointerEvents="none"
        />
        <Text style={[styles.name, isBar && styles.nameBar]} numberOfLines={2}>
          {name}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: { borderRadius: radii.lg, backgroundColor: "transparent", ...shadows.card },
  tile: { aspectRatio: 1 },
  bar: { width: "100%", minHeight: 140, marginBottom: spacing.md },
  card: { flex: 1, borderRadius: radii.lg, overflow: "hidden", justifyContent: "flex-end", padding: spacing.sm },
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
    height: "42%",
  },
  name: { ...typography.bodyMedium, fontFamily: fonts.albumLabel, color: colors.white },
  nameBar: { ...typography.subheading, fontFamily: fonts.albumLabel, color: colors.white },
  subtitle: { ...typography.caption, fontFamily: fonts.albumBody, color: colors.white, marginTop: spacing.xxs },
});