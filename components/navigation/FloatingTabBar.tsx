import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors, dimensions, interaction, navigation as navigationTokens, radii, shadows, spacing } from "@/constants/theme";

const TAB_LABELS: Record<string, string> = { camera: "Camera", album: "Cat Album", calendar: "Calendar", status: "My Cats", settings: "Settings" };

const TAB_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  camera: "camera",
  album: "images",
  calendar: "calendar",
  status: "paw",
  settings: "settings-outline",
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
          const iconName = TAB_ICONS[route.name] ?? "ellipse";

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
                <Ionicons
                  name={iconName}
                  size={dimensions.icon}
                  color={isFocused ? colors.textPrimary : colors.textSecondary}
                />
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
  iconCircleActive: { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.textPrimary },
});
