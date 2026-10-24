import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { PresentationProvider, usePresentationBlock } from "@/context/PresentationContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Comfortaa_700Bold } from "@expo-google-fonts/comfortaa";
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { CatDataProvider } from "../context/CatDataContext";
import { WellnessProvider } from "@/context/WellnessContext";
import BrandedSplash from "@/components/common/BrandedSplash";
import { colors } from "@/constants/theme";

void SplashScreen.preventAutoHideAsync().catch(() => {});

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

function Startup({ fontsReady }: { fontsReady: boolean }) {
  const { isLoading } = useAuth();
  const [finished, setFinished] = useState(false);
  usePresentationBlock(!finished);
  const ready = fontsReady && !isLoading;
  return <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={() => { void SplashScreen.hideAsync().catch(() => {}); }}>
    {ready ? <CatDataProvider><WellnessProvider><RootNavigation /></WellnessProvider></CatDataProvider> : null}
    {!finished ? <View style={StyleSheet.absoluteFillObject}>
      <BrandedSplash ready={ready} onComplete={() => setFinished(true)} />
    </View> : null}
  </View>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Comfortaa_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  return <SafeAreaProvider><PresentationProvider><AuthProvider>
    <Startup fontsReady={fontsLoaded || !!fontError} />
  </AuthProvider></PresentationProvider></SafeAreaProvider>;
}