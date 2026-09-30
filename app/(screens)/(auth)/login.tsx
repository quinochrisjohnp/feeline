import React from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/common/ScreenContainer";
import GoogleButton from "@/components/common/GoogleButton";
import PlaceholderBox from "@/components/common/PlaceholderBox";
import EmotionLogoGrid from "@/components/common/EmotionLogoGrid";
import { useAuth } from "@/context/AuthContext";
import { colors, dimensions, spacing, typography } from "@/constants/theme";

const Login = () => {
  const { signIn, isSigningIn, error } = useAuth();

  const router = useRouter();

  return (
    <ScreenContainer scroll verticalPadding constrainWidth>
      <View style={styles.content}>
        <EmotionLogoGrid />

        <Text style={styles.title}>FeELINE</Text>
        <Text style={styles.subtitle}>Understand your cat&apos;s emotional cues</Text>

        <PlaceholderBox
          icon="happy-outline"
          label="Cat illustration placeholder"
          backgroundColor={colors.emotion.happy}
          labelColor={colors.textPrimary}
          aspectRatio={1}
          style={styles.illustration}
        />

        <GoogleButton onPress={signIn} loading={isSigningIn} />
        <Text style={styles.mockNote}>Mock sign-in · No Google account is connected.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.terms}>By continuing, you agree to our</Text>
        <View style={styles.links}>
          <TouchableOpacity style={styles.linkTarget} accessibilityRole="link"
            onPress={() => router.push("/(screens)/settings-terms")}>
            <Text style={styles.termsLink}>Terms and Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkTarget} accessibilityRole="link"
            onPress={() => router.push("/(screens)/settings-privacy")}>
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

export default Login;

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.md },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  illustration: { width: "75%", maxWidth: 240, marginBottom: spacing.lg },
  mockNote: { ...typography.caption, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm, textAlign: "center" },
  terms: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  links: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: spacing.md },
  linkTarget: { minHeight: dimensions.touchTarget, maxWidth: "100%", justifyContent: "center" },
  termsLink: { ...typography.caption, color: colors.textPrimary, textDecorationLine: "underline", textAlign: "center" },
});
