import { Platform, TextStyle, ViewStyle } from "react-native";

export const colors = {
  background: "#FFF7E9",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  overlay: "rgba(59, 42, 32, 0.45)",

  textPrimary: "#3B2A20",
  textSecondary: "#8A7A6B",
  textMuted: "#B5A797",
  textInverse: "#FFFFFF",

  border: "#EFE1CE",
  divider: "#F1E4D2",

  primary: "#FDAC76",
  primaryDark: "#F3924F",
  accent: "#9EC7DE",

  danger: "#E2543F",
  dangerSoft: "#FBE2DD",
  success: "#7BB88E",

  white: "#FFFFFF",
  black: "#241A12",

  emotion: {
    happy: "#FED962",
    neutral: "#FEDEA1",
    fear: "#9EC7DE",
    angry: "#FDAC76",
  },
} as const;

export const typography: Record<string, TextStyle> = {
  display: { fontSize: 40, fontWeight: "700", lineHeight: 46 },
  heading: { fontSize: 28, fontWeight: "700", lineHeight: 34 },
  subheading: { fontSize: 20, fontWeight: "600", lineHeight: 26 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 22 },
  bodyMedium: { fontSize: 16, fontWeight: "600", lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  label: { fontSize: 14, fontWeight: "500", lineHeight: 18 },
  button: { fontSize: 16, fontWeight: "700", lineHeight: 20 },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  // Extra bottom clearance so scrollable content isn't hidden behind the
  // floating tab bar.
  tabBarClearance: 110,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

const cardShadow: ViewStyle =
  Platform.OS === "android"
    ? { elevation: 4 }
    : {
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      };

const floatingShadow: ViewStyle =
  Platform.OS === "android"
    ? { elevation: 8 }
    : {
        shadowColor: "#000000",
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      };

export const shadows = {
  card: cardShadow,
  floating: floatingShadow,
};

const theme = { colors, typography, spacing, radii, shadows };

export default theme;