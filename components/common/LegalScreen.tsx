import { useCallback, type ReactNode } from "react";
import { BackHandler, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { dimensions, spacing } from "@/constants/theme";
import ScreenContainer from "./ScreenContainer";
import DetailScreenHeader from "./DetailScreenHeader";

/** Public legal pages share a fixed header and a safe direct-link fallback. */
export default function LegalScreen({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const { profile } = useAuth();
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(profile ? "/(screens)/(tabs)/settings" : "/(screens)/(auth)/login");
  }, [profile, router]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (router.canGoBack()) return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [goBack, router]));

  return (
    <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader title={title} onBack={goBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  body: { width: "100%", maxWidth: dimensions.contentMaxWidth, alignSelf: "center" },
});
