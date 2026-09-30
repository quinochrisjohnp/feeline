import { Stack } from "expo-router";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import BrandedSplash from "@/components/common/BrandedSplash";

/**
 * Hosts the auth flow, the tabbed app, and any "deep" screens that should
 * cover the entire display (including the floating tab bar). Screens like
 * settings-about, camera-result, camera-save, etc. are added here as
 * siblings of (tabs) so pushing to them hides the tab bar automatically —
 * no per-screen hide/show logic required.
 */
export default function ScreensLayout() {
  const { profile, isLoading } = useAuth();
  if (isLoading) return <BrandedSplash />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!profile}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
      <Stack.Protected guard={!!profile}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="camera-result" />
        <Stack.Screen name="camera-save" />
        <Stack.Screen name="album-folder" />
        <Stack.Screen name="album-photo" />
        <Stack.Screen name="settings-about" />
        <Stack.Screen name="settings-feedback" />
      </Stack.Protected>
      <Stack.Screen name="settings-terms" />
      <Stack.Screen name="settings-privacy" />
    </Stack>
  );
}
