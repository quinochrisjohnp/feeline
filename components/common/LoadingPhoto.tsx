import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import MockPhoto from "./MockPhoto";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";

/** Scoped to the photo rectangle; never obscures the result card or header. */
function CatPhotoSpinner() {
  const rotation = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (live) setReducedMotion(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => { live = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => { loop.stop(); rotation.stopAnimation(); rotation.setValue(0); };
  }, [rotation, reducedMotion]);
  return <View pointerEvents="none" style={styles.loading} accessible accessibilityLabel="Loading cat photo" accessibilityState={{ busy: true }} accessibilityLiveRegion="polite">
    <Animated.View style={{ width: 88, height: 88, maxWidth: "75%", maxHeight: "75%", transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
      <Image source={require("../images/loading-icon.png")} resizeMode="contain" style={styles.icon} accessible={false} />
    </Animated.View>
    <Text style={styles.loadingLabel}>Loading image…</Text>
  </View>;
}
export default function LoadingPhoto({ imageUri }: { imageUri: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">("loading");
  return <>
    <MockPhoto imageUri={imageUri} label="Cat photo" size={48} resizeMode="contain" onLoad={() => setStatus("loaded")} onError={() => setStatus("failed")} />
    {status === "loading" && <CatPhotoSpinner />}
    {status === "failed" && <View style={styles.loading}><Text accessibilityRole="alert" style={styles.error}>The photo could not load. Please check your connection.</Text></View>}
  </>;
}
const styles = StyleSheet.create({
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  loadingLabel: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  icon: { width: "100%", height: "100%" },
  error: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary, textAlign: "center", padding: spacing.sm },
});
