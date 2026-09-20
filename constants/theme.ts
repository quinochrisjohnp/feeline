import { Platform, TextStyle, ViewStyle } from "react-native";

export const colors = {
  background: "#FFF7E9",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  overlay: "rgba(59, 42, 32, 0.45)",

  textPrimary: "#3B2A20",
  // Warm brown, deepened for readable small text on cream and white.
  textSecondary: "#756456",
  textMuted: "#827362",
  textInverse: "#FFFFFF",

  border: "#EFE1CE",
  divider: "#F1E4D2",

  primary: "#FDAC76",
  primaryDark: "#F3924F",
  accent: "#9EC7DE",

  danger: "#E2543F",
  dangerSoft: "#FBE2DD",
  dangerStrong: "#B53F30",
  success: "#7BB88E",

  white: "#FFFFFF",
  black: "#241A12",
  cameraBackground: "#000000",
  cameraRing: "rgba(255,255,255,0.35)",
  cameraScrim: "rgba(0,0,0,0.48)",
  cameraControl: "rgba(0,0,0,0.72)",
  cameraGuide: "rgba(255,255,255,0.8)",
  photoScrim: "rgba(36,26,18,0.7)",
  photoControl: "rgba(36,26,18,0.4)",
  googleMark: "#EA4335",
  placeholder: "#F1E4D2",
  focus: "#91613D",

  emotion: {
    happy: "#A8D8B9",
    neutral: "#FEDEA1",
    fear: "#B7A6D9",
    angry: "#E97866",
  },
} as const;

export const typography: Record<string, TextStyle> = {
  display: { fontSize: 40, fontWeight: "700", lineHeight: 46 },
  heading: { fontSize: 28, fontWeight: "700", lineHeight: 34 },
  subheading: { fontSize: 20, fontWeight: "600", lineHeight: 26 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: "600", lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  label: { fontSize: 14, fontWeight: "500", lineHeight: 18 },
  button: { fontSize: 16, fontWeight: "700", lineHeight: 20 },
  emoji: { fontSize: 22 },
  logoEmoji: { fontSize: 26 },
};

export const dimensions = {
  touchTarget: 44,
  button: 48,
  input: 48,
  messageInput: 120,
  contentMaxWidth: 600,
  dialogMaxWidth: 420,
  googleMaxWidth: 400,
  compactWidth: 360,
  actionMinWidth: 120,
  icon: 24,
  iconSmall: 18,
  iconLarge: 32,
  emotionBadge: 44,
  logo: 110,
  emptyStateIcon: 64,
  settingIcon: 36,
  settingRow: 64,
  capture: 78,
  captureInner: 62,
  sheetHandleWidth: 40,
  sheetHandleHeight: 4,
} as const;

export const interaction = { pressedOpacity: 0.8, disabledOpacity: 0.65 } as const;

export const navigation = {
  maxWidth: 360,
  iconCircle: dimensions.touchTarget,
  itemPadding: 4,
  barPadding: 8,
  gap: 4,
  bottomOffset: 16,
  contentGap: 24,
} as const;

export const getTabBarClearance = (bottomInset = 0) =>
  navigation.iconCircle + navigation.itemPadding * 2 + navigation.barPadding * 2 +
  navigation.bottomOffset + navigation.contentGap + bottomInset;

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
  tabBarClearance: getTabBarClearance(),
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
        shadowColor: colors.textPrimary,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      };

const floatingShadow: ViewStyle =
  Platform.OS === "android"
    ? { elevation: 8 }
    : {
        shadowColor: colors.textPrimary,
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      };

export const shadows = {
  card: cardShadow,
  floating: floatingShadow,
};

const theme = { colors, typography, spacing, radii, shadows, dimensions, interaction, navigation, getTabBarClearance };

export default theme;
