import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Comfortaa_700Bold } from "@expo-google-fonts/comfortaa";
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { AuthProvider } from "../context/AuthContext";
import { CatDataProvider } from "../context/CatDataContext";
import BrandedSplash from "@/components/common/BrandedSplash";
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
  const [fontsLoaded] = useFonts({
    Comfortaa_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <BrandedSplash />
      </SafeAreaProvider>
    );
  }

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