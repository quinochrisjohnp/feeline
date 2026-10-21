import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";

/** Render only for an actual pending operation. This component never completes requests. */
export default function FeelineLoadingOverlay() {
  const [reducedMotion, setReducedMotion] = useState(true);
  const rotation = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const left = useRef(new Animated.Value(0)).current;
  const right = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const size = Math.min(170, width * 0.42, height * 0.26);
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
    const side = (value: Animated.Value, delay: number) => Animated.loop(Animated.sequence([
      Animated.delay(delay), timing(value, 1, 2400), timing(value, 0, 2400), Animated.delay(800),
    ]));
    const animations = [
      Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(Animated.sequence([timing(breath, 1, 2800), timing(breath, 0, 2800)])),
      side(left, 300), side(right, 1500),
    ];
    animations.forEach(a => a.start());
    return () => {
      animations.forEach(a => a.stop());
      [rotation, breath, left, right].forEach(value => { value.stopAnimation(); value.setValue(0); });
    };
  }, [reducedMotion, rotation, breath, left, right]);
  return (
    <View style={styles.overlay} accessibilityViewIsModal testID="feeline-loading">
      <StatusBar style="dark" />
      <Animated.View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFillObject,
        { backgroundColor: colors.primary, opacity: reducedMotion ? 0 : breath.interpolate({ inputRange: [0,1], outputRange: [0,0.055] }) }]} />
      {[left, right].map((value, index) => (
        <Animated.View key={index} pointerEvents="none" accessible={false} accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants" style={[styles.decoration,
            index === 0 ? { left: "6%", top: "34%" } : { right: "6%", top: "60%" },
            { opacity: reducedMotion ? 0 : value.interpolate({ inputRange: [0,0.5,1], outputRange: [0,0.4,0] }),
              transform: [{ translateY: value.interpolate({ inputRange: [0,1], outputRange: [8,-8] }) }] }]}>
          <Ionicons name={index === 0 ? "paw" : "heart"} size={20} color={colors.textSecondary} />
        </Animated.View>
      ))}
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
  decoration: { position: "absolute" },
});
