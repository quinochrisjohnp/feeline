import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import EmotionLogoGrid from "./EmotionLogoGrid";
import ScreenContainer from "./ScreenContainer";
/** A single root-owned logo fades away when auth/resources are ready. */
export default function BrandedSplash({ ready = false, onComplete }: { ready?: boolean; onComplete?: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    if (!ready) return;
    const animation = Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) complete.current?.(); });
    return () => animation.stop();
  }, [ready, opacity]);
  return <Animated.View style={[styles.root, { opacity }]}>
    <ScreenContainer contentContainerStyle={styles.content}><EmotionLogoGrid /></ScreenContainer>
  </Animated.View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, content: { alignItems: "center", justifyContent: "center" } });
