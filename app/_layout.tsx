import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootNavigation() {
  const { profile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const path = segments.join("/");
    const inAuthGroup = path.includes("(auth)");
    const inTabsGroup = path.includes("(tabs)");

    if (!profile && !inAuthGroup) {
      router.replace("/(screens)/(auth)/login");
    } else if (profile && !inTabsGroup) {
      router.replace("/(screens)/(tabs)/camera");
    }
  }, [profile, isLoading, segments, router]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(screens)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}