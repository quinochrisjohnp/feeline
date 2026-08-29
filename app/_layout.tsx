import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CatDataProvider } from "../context/CatDataContext";
import { colors } from "@/constants/theme";

function RootNavigation() {
  const { profile, isLoading } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments.includes("(auth)");

    if (!profile && !inAuthGroup) {
      router.replace("/(screens)/(auth)/login");
      return;
    }

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
        <CatDataProvider>
          <RootNavigation />
        </CatDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}