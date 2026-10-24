import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";

/** Render only for an actual pending operation. This component never completes requests. */
export default function FeelineLoadingOverlay() {
  const [reducedMotion, setReducedMotion] = useState(true);
  const rotation = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const size = Math.min(130, width * 0.33, height * 0.22);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReducedMotion(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    AccessibilityInfo.announceForAccessibility("Photo analysis in progress. This may take a moment.");
    return () => { mounted = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    if (reducedMotion) return;
    const timing = (value: Animated.Value, toValue: number, duration: number) =>
      Animated.timing(value, { toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const cycle = (value: Animated.Value, duration: number) => Animated.loop(Animated.sequence([
      timing(value, 1, duration), timing(value, 0, duration),
    ]));
    const animations = [
      Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(Animated.sequence([timing(breath, 1, 2800), timing(breath, 0, 2800)])),
      cycle(drift, 7000),
    ];
    animations.forEach(a => a.start());
    return () => {
      animations.forEach(a => a.stop());
      [rotation, breath, drift].forEach(value => { value.stopAnimation(); value.setValue(0); });
    };
  }, [reducedMotion, rotation, breath, drift]);
  return (
    <View style={styles.overlay} accessibilityViewIsModal testID="feeline-loading">
      <StatusBar style="dark" />
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFillObject, { padding: spacing.sm }]}>
        <Animated.View style={{ flex: 1, opacity: reducedMotion ? 0.75 : drift.interpolate({ inputRange: [0,1], outputRange: [0.7,0.85] }),
          transform: [{ translateX: drift.interpolate({ inputRange: [0,1], outputRange: [-3,3] }) },
            { translateY: drift.interpolate({ inputRange: [0,1], outputRange: [2,-2] }) },
            { scale: drift.interpolate({ inputRange: [0,1], outputRange: [0.975,1] }) }] }}>
          <Image source={require("../images/bg2.png")} resizeMode="contain" style={{ width: "100%", height: "100%" }} />
        </Animated.View>
      </View>
      <Animated.View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={{ transform: [
          { translateY: breath.interpolate({ inputRange: [0,1], outputRange: [0,-4] }) },
          { scale: breath.interpolate({ inputRange: [0,1], outputRange: [1,1.025] }) },
          { rotate: rotation.interpolate({ inputRange: [0,1], outputRange: ["0deg","360deg"] }) },
        ] }}>
        <Image source={require("../images/loading-icon.png")} resizeMode="contain"
          style={{ width: size, height: size, aspectRatio: 1 }} accessible={false} />
      </Animated.View>
      <Text style={styles.title}>Getting to know this cat…</Text>
      <Text style={styles.support}>This may take a moment.</Text>
      {reducedMotion ? <ActivityIndicator color={colors.textSecondary} accessibilityLabel="Photo analysis in progress" /> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, backgroundColor: colors.background,
    alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  title: { ...typography.subheading, fontFamily: fontFamily.heading, color: colors.textPrimary, textAlign: "center", marginTop: spacing.lg },
  support: { ...typography.body, fontFamily: fontFamily.body, color: colors.textSecondary, textAlign: "center" },
});
