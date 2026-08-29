import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { colors } from "@/constants/theme";

function RootNavigation() {
  const { profile, isLoading } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments.includes("(auth)");

    // Not logged in and not already on the login screen → force login.
    if (!profile && !inAuthGroup) {
      router.replace("/(screens)/(auth)/login");
      return;
    }

    // Logged in but still sitting on the login screen (e.g. session was
    // just restored) → send into the app. IMPORTANT: this must NOT trigger
    // just because the user is on a deep sibling screen (settings-about,
    // camera-result, etc.) outside (tabs) — only when still on (auth).
    if (profile && inAuthGroup) {
      router.replace("/(screens)/(tabs)/camera");
    }
  }, [profile, isLoading, segments, router]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(screens)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}