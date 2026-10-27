import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { cancelAnimation, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { colors, dimensions, radii } from "@/constants/theme";

/** Calendar layout runs on the UI thread; only completed snaps update React state. */
export function useCalendarPanel(distance: number) {
  const progress = useSharedValue(0), origin = useSharedValue(0);
  const [settledExpanded, setSettledExpanded] = useState(false);
  const snap = useCallback((value: number) => {
    setSettledExpanded(false);
    progress.value = withTiming(value, { duration: 220, reduceMotion: ReduceMotion.System }, finished => {
      if (finished) runOnJS(setSettledExpanded)(value === 1);
    });
  }, [progress]);
  const gesture = useMemo(() => Gesture.Pan().minDistance(4)
    .onStart(() => { cancelAnimation(progress); origin.value = progress.value; runOnJS(setSettledExpanded)(false); })
    .onUpdate(event => { progress.value = Math.max(0, Math.min(1, origin.value - event.translationY / Math.max(1, distance))); })
    .onFinalize((event, success) => {
      const target = success && Math.abs(event.velocityY) > 400 ? (event.velocityY < 0 ? 1 : 0) : progress.value >= 0.5 ? 1 : 0;
      progress.value = withTiming(target, { duration: 220, reduceMotion: ReduceMotion.System }, finished => {
        if (finished) runOnJS(setSettledExpanded)(target === 1);
      });
    }), [distance, origin, progress]);
  useEffect(() => () => cancelAnimation(progress), [progress]);
  return { progress, gesture, snap, settledExpanded };
}
/** Horizontal swipes only; vertical calendar collapse keeps its own handle. */
export function CalendarSwipeArea({ onSwipe, children }: { onSwipe: (offset: number) => void; children: React.ReactNode }) {
  const gesture = useMemo(() => Gesture.Pan().activeOffsetX([-24, 24]).failOffsetY([-16, 16]).runOnJS(true)
    .onEnd(event => {
      if (Math.abs(event.translationX) >= 48) onSwipe(event.translationX < 0 ? 1 : -1);
    }), [onSwipe]);
  return <GestureDetector gesture={gesture}><View collapsable={false}>{children}</View></GestureDetector>;
}
export function CalendarDragHandle({ panel, label }: { panel: ReturnType<typeof useCalendarPanel>; label: string }) {
  return <GestureDetector gesture={panel.gesture}><View collapsable={false}>
    <Pressable style={styles.touch} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: panel.settledExpanded }} onPress={() => panel.snap(panel.settledExpanded ? 0 : 1)}><View style={styles.handle} /></Pressable>
  </View></GestureDetector>;
}
export function CalendarWeek({ progress, active, height, children }: { progress: SharedValue<number>; active: boolean; height: number; children: React.ReactNode }) {
  const animated = useAnimatedStyle(() => ({ height: active ? height : height * (1 - progress.value), opacity: active ? 1 : 1 - progress.value }));
  return <Animated.View style={[styles.week, animated]}>{children}</Animated.View>;
}
const styles = StyleSheet.create({
  week: { flexDirection: "row", overflow: "hidden" },
  touch: { height: 44, alignItems: "center", justifyContent: "center" },
  handle: { width: dimensions.sheetHandleWidth, height: dimensions.sheetHandleHeight, borderRadius: radii.pill, backgroundColor: colors.border },
});
