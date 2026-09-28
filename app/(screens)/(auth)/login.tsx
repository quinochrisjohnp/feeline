import React, { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/common/ScreenContainer";
import GoogleButton from "@/components/common/GoogleButton";
import EmotionLogoGrid from "@/components/common/EmotionLogoGrid";
import { useAuth } from "@/context/AuthContext";
import { colors, dimensions, spacing, typography } from "@/constants/theme";

const Login = () => {
  const { signIn, isSigningIn, error } = useAuth();

  const router = useRouter();
  const scroll = useRef<ScrollView>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const illustrationRatio = 1122 / 1402;
  const illustrationHeight = viewport.height > 0
    ? Math.min(220, viewport.height * 1,
      Math.max(0, Math.min(viewport.width, dimensions.contentMaxWidth) - spacing.lg * 2) * 0.75 / illustrationRatio)
    : 160;

  return (
    <ScreenContainer module="auth" keyboardAware padded={false}>
      <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} bounces={false} alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        onLayout={({ nativeEvent: { layout } }) => {
          // Restore the top after keyboard dismissal or a taller viewport.
          if (layout.height > viewport.height) scroll.current?.scrollTo({ y: 0, animated: false });
          setViewport((previous) => previous.width === layout.width && previous.height === layout.height
            ? previous : { width: layout.width, height: layout.height });
        }}>
      <View style={styles.content}>
        <EmotionLogoGrid />
        <Text style={styles.subtitle}>Understand your cat&apos;s emotional cues</Text>

        <Image source={require("@/components/images/illustration.png")} resizeMode="contain"
          style={[styles.illustration, { width: illustrationHeight * illustrationRatio, height: illustrationHeight }]} accessible={false} importantForAccessibility="no" />

        <GoogleButton onPress={signIn} loading={isSigningIn} />

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
      </ScrollView>
    </ScreenContainer>
  );
};

export default Login;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, width: "100%", maxWidth: dimensions.contentMaxWidth, alignSelf: "center",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.md },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  illustration: { marginBottom: spacing.sm },
  mockNote: { ...typography.caption, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm, textAlign: "center" },
  terms: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  links: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: spacing.md },
  linkTarget: { minHeight: dimensions.touchTarget, maxWidth: "100%", justifyContent: "center" },
  termsLink: { ...typography.caption, color: colors.textPrimary, textDecorationLine: "underline", textAlign: "center" },
});
