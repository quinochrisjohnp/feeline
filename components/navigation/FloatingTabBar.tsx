import React from "react";
import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, dimensions, interaction, navigation as navigationTokens, radii, shadows, spacing } from "@/constants/theme";

const TAB_LABELS: Record<string, string> = { camera: "Camera", album: "Cat Album", calendar: "Calendar", status: "My Cats", settings: "Settings" };

// Custom multicolor image assets — components/images/*.png. Do not apply
// tintColor to these; their original colors must be preserved.
const TAB_IMAGES: Record<string, ImageSourcePropType> = {
  camera: require("../images/camera.png"),
  album: require("../images/album.png"),
  calendar: require("../images/calendar.png"),
  status: require("../images/profile.png"),
  settings: require("../images/settings.png"),
};

/** Floating pill-shaped bottom nav matching the FeELINE Figma prototype. */
export default function FloatingTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeOptions = descriptors[state.routes[state.index].key].options;
  const activeStyle = StyleSheet.flatten(activeOptions.tabBarStyle);
  if (activeStyle && "display" in activeStyle && activeStyle.display === "none") return null;

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + navigationTokens.bottomOffset }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const imageSource = TAB_IMAGES[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={interaction.pressedOpacity}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel ?? TAB_LABELS[route.name] ?? route.name}
              style={styles.tabButton}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
            >
              <View style={[styles.iconCircle, isFocused && styles.iconCircleActive]}>
                {imageSource ? (
                  <Image source={imageSource} style={styles.tabImage} resizeMode="contain" />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 0, right: 0, alignItems: "center", paddingHorizontal: spacing.sm },
  bar: {
    flexDirection: "row",
    width: "100%",
    maxWidth: navigationTokens.maxWidth,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: navigationTokens.barPadding,
    paddingVertical: navigationTokens.barPadding,
    gap: navigationTokens.gap,
    ...shadows.floating,
  },
  tabButton: { flex: 1, minWidth: dimensions.touchTarget, minHeight: dimensions.touchTarget, alignItems: "center", paddingVertical: navigationTokens.itemPadding },
  iconCircle: {
    width: navigationTokens.iconCircle,
    height: navigationTokens.iconCircle,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  iconCircleActive: { backgroundColor: colors.background, borderWidth: 2, borderColor: colors.textPrimary },
  tabImage: { width: dimensions.nav_icon, height: dimensions.nav_icon, borderRadius: dimensions.nav_icon / 2 },
});