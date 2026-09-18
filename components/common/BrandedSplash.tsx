import { StyleSheet, Text } from "react-native";
import EmotionLogoGrid from "./EmotionLogoGrid";
import ScreenContainer from "./ScreenContainer";
import { colors, spacing, typography } from "@/constants/theme";

/** Static branding while the existing mock session is restored. */
export default function BrandedSplash() {
  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <EmotionLogoGrid />
      <Text style={styles.title}>FeELINE</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center", justifyContent: "center" },
  title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.md },
});
