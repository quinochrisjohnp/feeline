import React, { useRef } from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MockPhoto from "@/components/common/MockPhoto";
import { colors, fonts, radii, shadows, spacing, typography } from "@/constants/theme";

interface CatCoverCardProps {
  name: string;
  coverUri?: string | null;
  variant?: "tile" | "bar";
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  selected?: boolean;
  faded?: boolean;
}

/**
 * Photo-background card with a name overlay.
 *
 * IMAGE-SAFETY INVARIANT: MockPhoto below is rendered exactly once,
 * unconditionally, and is NEVER wrapped in an Animated view, NEVER given a
 * pressed/selected-dependent opacity, and NEVER conditionally unmounted.
 * `selected` and `faded` are separate, `pointerEvents="none"` overlay Views
 * stacked ABOVE the photo — they never touch the photo's own style or
 * mounting. This uses Pressable (not TouchableOpacity), which has no
 * built-in Animated.Value driving opacity on press/release, so there is
 * nothing left that can leave the photo's layer in a stuck/hidden state
 * after a gesture ends.
 */
export default function CatCoverCard({ name, coverUri, variant = "tile", onPress, onLongPress, style, subtitle, selected = false, faded = false }: CatCoverCardProps) {
  const isBar = variant === "bar";
  const longPressed = useRef(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${name}, ${subtitle}` : name}
      accessibilityHint={onLongPress ? "Open album. Hold for Rename and Delete." : undefined}
      accessibilityState={{ selected }}
      onPressIn={() => { longPressed.current = false; }}
      onPress={() => { if (!longPressed.current) onPress?.(); }}
      onLongPress={onLongPress ? () => { longPressed.current = true; onLongPress(); } : undefined}
      style={[styles.shadowWrap, isBar ? styles.bar : styles.tile, style]}
    >
      <View style={styles.clipped}>
        <View style={styles.photoPlaceholder}>
          <MockPhoto imageUri={coverUri} icon="paw" size={isBar ? 30 : 24} />
        </View>

        <LinearGradient
          colors={["transparent", colors.photoScrim]}
          locations={[0, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

        {faded ? <View pointerEvents="none" style={styles.dimOverlay} /> : null}
        {selected ? <View pointerEvents="none" style={styles.selectionBorder} /> : null}

        <Text style={[styles.name, isBar && styles.nameBar]} numberOfLines={2}>
          {name}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Outer: sizing + shadow. Must stay unclipped or the shadow disappears.
  shadowWrap: { borderRadius: radii.lg, backgroundColor: "transparent", ...shadows.card },
  tile: { aspectRatio: 1 },
  bar: { width: "100%", minHeight: 140, marginBottom: spacing.md },
  // Inner: the actual clipped, rounded surface. The photo always lives here
  // at opacity 1 — dimming/selection are overlays painted above it.
  clipped: { flex: 1, borderRadius: radii.lg, overflow: "hidden", justifyContent: "flex-end", padding: spacing.sm },
  photoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "42%" },
  dimOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  selectionBorder: { ...StyleSheet.absoluteFillObject, borderRadius: radii.lg, borderWidth: 2, borderColor: colors.textPrimary },
  name: { ...typography.bodyMedium, fontFamily: fonts.albumLabel, color: colors.white },
  nameBar: { ...typography.subheading, fontFamily: fonts.albumLabel, color: colors.white },
  subtitle: { ...typography.caption, fontFamily: fonts.albumBody, color: colors.white, marginTop: spacing.xxs },
});