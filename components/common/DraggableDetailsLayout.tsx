import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, PanResponder, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, dimensions, radii, spacing } from "@/constants/theme";
import MockPhoto from "./MockPhoto";

/** Only the handle owns the pan gesture; detail text retains native scrolling. */
export function usePanelProgress(distance: number, onCollapsed?: () => void) {
  const collapsedCallback = useRef(onCollapsed);
  collapsedCallback.current = onCollapsed;
  const progress = useRef(new Animated.Value(0)).current;
  const current = useRef(0), origin = useRef(0), reduced = useRef(false);
  const [settledExpanded, setSettledExpanded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (live) reduced.current = value; });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", value => { reduced.current = value; });
    const id = progress.addListener(({ value }) => { current.current = value; });
    return () => { live = false; subscription.remove(); progress.removeListener(id); progress.stopAnimation(); };
  }, [progress]);
  const snap = useCallback((value: number) => {
    setSettledExpanded(false);
    setExpanded(value === 1);
    Animated.timing(progress, { toValue: value, duration: reduced.current ? 0 : 220, useNativeDriver: false }).start(({ finished }) => { if (finished) { setSettledExpanded(value === 1); if (value === 0) collapsedCallback.current?.(); } });
  }, [progress]);
  const handlers = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => { setSettledExpanded(false); progress.stopAnimation(); origin.current = current.current; },
    onPanResponderMove: (_, gesture) => { progress.setValue(Math.max(0, Math.min(1, origin.current - gesture.dy / Math.max(1, distance)))); },
    onPanResponderRelease: (_, gesture) => snap(Math.abs(gesture.vy) > 0.4 ? (gesture.vy < 0 ? 1 : 0) : current.current >= 0.5 ? 1 : 0),
    onPanResponderTerminate: () => snap(current.current >= 0.5 ? 1 : 0),
  }), [distance, progress, snap]);
  return { progress, expanded, settledExpanded, snap, handlers: handlers.panHandlers };
}
export function SheetHandle({ panel, label }: { panel: ReturnType<typeof usePanelProgress>; label: string }) {
  return <View {...panel.handlers}><Pressable style={styles.touch} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ expanded: panel.expanded }} onPress={() => panel.snap(panel.expanded ? 0 : 1)}>
    <View style={styles.handle} />
  </Pressable></View>;
}
export default function DraggableDetailsLayout({ imageUri, children, footer, detailsVisible = true, onDismiss }: {
  imageUri: string; children: React.ReactNode; footer?: React.ReactNode;
  detailsVisible?: boolean; onDismiss?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  // Image always retains at least 22% of available space; collapsed sheet retains its summary.
  const [footerHeight, setFooterHeight] = useState(0);
  const dismissible = !!onDismiss;
  const available = Math.max(0, height - (dismissible ? footerHeight : 0));
  const collapsed = dismissible ? 0 : available * 0.44, maximum = available * 0.78;
  const panel = usePanelProgress(maximum - collapsed, () => { if (detailsVisible) onDismiss?.(); });
  const { snap } = panel;
  useEffect(() => {
    if (dismissible) snap(detailsVisible ? 0.44 / 0.78 : 0);
  }, [dismissible, detailsVisible, snap]);
  const sheetHeight = panel.progress.interpolate({ inputRange: [0, 1], outputRange: [collapsed, maximum] });
  return <View style={styles.root} onLayout={event => setHeight(event.nativeEvent.layout.height)}>
    <View style={styles.image}><MockPhoto size={48} imageUri={imageUri} label="Cat photo" resizeMode="contain" /></View>
    <Animated.View style={[styles.sheet, { height: sheetHeight, paddingBottom: dismissible ? 0 : insets.bottom }]}>
      {detailsVisible && <>
      <SheetHandle panel={panel} label="Expand or collapse photo details" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator>{children}</ScrollView>
      </>}
      {!dismissible && footer}
    </Animated.View>
    {dismissible && <View style={{ backgroundColor: colors.surface, paddingBottom: insets.bottom }} onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}>{footer}</View>}
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, image: { flex: 1, margin: spacing.sm, minHeight: 0 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, overflow: "hidden" },
  touch: { height: 44, alignItems: "center", justifyContent: "center" },
  handle: { width: dimensions.sheetHandleWidth, height: dimensions.sheetHandleHeight, borderRadius: radii.pill, backgroundColor: colors.border },
  scroll: { flex: 1 }, content: { paddingBottom: spacing.sm },
});
