import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import EmotionLogoGrid from "./EmotionLogoGrid";
import ScreenContainer from "./ScreenContainer";

/** Runs alongside session restoration, never delaying it. */
export default function BrandedSplash() {
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(entrance, { toValue: 1, duration: 350, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [entrance]);
  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <Animated.View style={{ opacity: entrance, transform: [{ scale: entrance.interpolate({
        inputRange: [0, 1], outputRange: [0.92, 1],
      }) }] }}>
        <EmotionLogoGrid />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center", justifyContent: "center" },
});
