import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { CatDataProvider } from "../context/CatDataContext";
import { colors } from "@/constants/theme";

function RootNavigation() {
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
