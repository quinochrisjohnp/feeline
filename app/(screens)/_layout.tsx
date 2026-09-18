import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

/**
 * Hosts the auth flow, the tabbed app, and any "deep" screens that should
 * cover the entire display (including the floating tab bar). Screens like
 * settings-about, camera-result, camera-save, etc. are added here as
 * siblings of (tabs) so pushing to them hides the tab bar automatically —
 * no per-screen hide/show logic required.
 */
export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}