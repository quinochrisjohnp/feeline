import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Easing, Image, StyleSheet,
  type ImageSourcePropType, type StyleProp, type ViewStyle, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";

/** Two contained layers; only opacity changes. Parent supplies fixed viewport bounds. */
export default function CrossfadeBackground({ source, nextSource, style, testID }: {
  source: ImageSourcePropType; nextSource: ImageSourcePropType; style: StyleProp<ViewStyle>; testID: string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(true);
  const [active, setActive] = useState(AppState.currentState === "active");
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [nextLoaded, setNextLoaded] = useState(false);
  const focused = useIsFocused();
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReducedMotion(value);
    }).catch(() => {});
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    const app = AppState.addEventListener("change", state => setActive(state === "active"));
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);
  useEffect(() => {
    if (reducedMotion || !focused || !active || !baseLoaded || !nextLoaded) return;
    const fade = (toValue: number) => Animated.timing(opacity, {
      toValue, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false,
    });
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(3500), fade(1), Animated.delay(3500), fade(0),
    ]));
    loop.start();
    return () => { loop.stop(); opacity.stopAnimation(); opacity.setValue(0); };
  }, [opacity, reducedMotion, focused, active, baseLoaded, nextLoaded]);
  return <View style={style} pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" testID={testID}>
    <Image source={source} resizeMode="contain" style={styles.image} accessible={false}
      onLoad={() => setBaseLoaded(true)} />
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: reducedMotion ? 0 : opacity }]}>
      <Image source={nextSource} resizeMode="contain" style={styles.image} accessible={false}
        onLoad={() => setNextLoaded(true)} />
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({ image: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" } });
