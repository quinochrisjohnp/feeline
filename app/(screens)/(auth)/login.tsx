import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/common/ScreenContainer";
import GoogleButton from "@/components/common/GoogleButton";
import PlaceholderBox from "@/components/common/PlaceholderBox";
import EmotionLogoGrid from "@/components/common/EmotionLogoGrid";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing, typography } from "@/constants/theme";

const Login = () => {
  const { signIn, isSigningIn, error } = useAuth();

  const handleTermsPress = () => {
    // TODO: link to the real Terms & Privacy Policy screens once built.
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.content}>
        <EmotionLogoGrid />

        <Text style={styles.title}>FeELINE</Text>
        <Text style={styles.subtitle}>“Understand your cat&apos;s emotion using AI”</Text>

        <PlaceholderBox
          icon="happy-outline"
          label="Cat Illustration"
          backgroundColor={colors.emotion.happy}
          labelColor={colors.textPrimary}
          aspectRatio={1}
          style={styles.illustration}
        />

        <GoogleButton onPress={signIn} loading={isSigningIn} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity onPress={handleTermsPress} accessibilityRole="link">
          <Text style={styles.terms}>
            By continuing, you agree to our{"\n"}
            <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

export default Login;

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.md },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  illustration: { width: "100%", marginBottom: spacing.xl },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm, textAlign: "center" },
  terms: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  termsLink: { color: colors.textSecondary, textDecorationLine: "underline" },
});
