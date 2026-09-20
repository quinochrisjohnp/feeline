import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FullBleedScreen from "@/components/common/FullBleedScreen";
import MockPhoto from "@/components/common/MockPhoto";
import Button from "@/components/common/Button";
import CaptureButton from "@/components/camera/CaptureButton";
import WhatToAvoidModal from "@/components/camera/WhatToAvoidModal";
import MockSampleModal from "@/components/camera/MockSampleModal";
import { createMockCapture, parseMockCapture, MOCK_SAMPLES, type MockSampleId, type MockCapture } from "@/services/mockDetection";
import { colors, dimensions, getTabBarClearance, interaction, radii, spacing, typography } from "@/constants/theme";

export default function Camera() {
  const router = useRouter();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission, refreshPermission] = useCameraPermissions();
  const camera = useRef<CameraView | null>(null);
  const [ready, setReady] = useState(false);
  const [mountError, setMountError] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const [avoidVisible, setAvoidVisible] = useState(false);
  const [samplesVisible, setSamplesVisible] = useState(false);
  const [sampleId, setSampleId] = useState<MockSampleId>("angry");
  const [reviewing, setReviewing] = useState(false);
  const [lastImage, setLastImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gallerySettings, setGallerySettings] = useState(false);
  const [guideWidth, setGuideWidth] = useState<number | undefined>();
  const lock = useRef(false);
  const active = useRef(false);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    active.current = true;
    lock.current = false;
    setReviewing(false);
    setReady(false);
    setMountError(false);
    void refreshPermission().catch(() => setError("Camera permission could not be checked. Please try again."));
    return () => {
      active.current = false;
      generation.current += 1;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      lock.current = false;
      setReady(false);
      setReviewing(false);
      setAvoidVisible(false);
      setSamplesVisible(false);
    };
  }, [refreshPermission]));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");
      if (state !== "active") setReady(false);
      else if (active.current) void refreshPermission().catch(() => {});
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const current = (ticket: number) => active.current && generation.current === ticket;
  const unlock = (ticket: number) => {
    if (!current(ticket)) return;
    lock.current = false;
    setReviewing(false);
  };
  const begin = () => {
    if (!active.current || lock.current) return null;
    lock.current = true;
    setReviewing(true);
    setError(null);
    setGallerySettings(false);
    return generation.current;
  };
  const prepare = (uri: string, source: MockCapture["source"], scenario: MockSampleId, ticket: number) => {
    if (!current(ticket)) return;
    const capture = createMockCapture(scenario, new Date().toISOString(), uri, source);
    if (!parseMockCapture({ ...capture })) throw new Error("Unavailable image");
    setLastImage(uri);
    timer.current = setTimeout(() => {
      timer.current = null;
      if (!current(ticket)) return;
      // Invalidate this operation before navigating, including an already queued callback.
      generation.current += 1;
      active.current = false;
      try {
        router.push({ pathname: "/camera-result", params: { ...capture } });
      } catch {
        active.current = true;
        setError("The result could not be opened. Please try again.");
      } finally {
        lock.current = false;
        setReviewing(false);
      }
    }, 450);
  };

  const handleCapture = async () => {
    if (!permission?.granted || !ready || !camera.current) return;
    const ticket = begin();
    if (ticket === null) return;
    const scenario = sampleId;
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.9 });
      if (!current(ticket)) return;
      if (!photo?.uri) throw new Error("No photo");
      prepare(photo.uri, "camera", scenario, ticket);
    } catch {
      if (current(ticket)) setError("We couldn't capture that photo. Please try again or choose one from your gallery.");
      unlock(ticket);
    }
  };

  const handleGallery = async () => {
    const ticket = begin();
    if (ticket === null) return;
    const scenario = sampleId;
    try {
      // The system photo picker grants access only to the chosen image; no broad library permission request.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsMultipleSelection: false, allowsEditing: false, quality: 1,
      });
      if (!current(ticket)) return;
      if (result.canceled) { unlock(ticket); return; }
      const uri = result.assets?.[0]?.uri;
      if (!uri) throw new Error("No selected image");
      prepare(uri, "gallery", scenario, ticket);
    } catch {
      if (!current(ticket)) return;
      setError("We couldn't open that photo. Try the gallery again, or check photo access in device settings.");
      setGallerySettings(Platform.OS !== "web");
      unlock(ticket);
    }
  };

  const handlePermission = async () => {
    if (lock.current) return;
    lock.current = true;
    try { await requestPermission(); }
    catch { setError("Camera access could not be requested. Please try again or use your gallery."); }
    finally { lock.current = false; }
  };
  const openSettings = async () => {
    try { await Linking.openSettings(); }
    catch { setError("Open your device settings and allow camera or photo access for FeELINE."); }
  };
  const sample = MOCK_SAMPLES.find((item) => item.id === sampleId)!;
  const resultLabel = sample.result.outcome === "error"
    ? ({ "no-cat": "No cat", blurry: "Blurry", dark: "Dark", cropped: "Cropped", error: "Error" } as Record<string, string>)[sampleId]
    : `${sampleId === "low" ? "Low confidence" : sample.label.replace(" cues", "")} ${sample.result.confidence}%`;
  const unavailable = !permission?.granted || mountError;
  const bottom = getTabBarClearance(insets.bottom);
  const top = insets.top + spacing.sm;

  return (
    <FullBleedScreen statusBarStyle={focused ? "light" : "auto"}>
      {focused && appActive && permission?.granted && !mountError ? (
        <CameraView key={cameraKey} ref={camera} style={StyleSheet.absoluteFill} facing="back" mode="picture"
          onCameraReady={() => { if (active.current) setReady(true); }}
          onMountError={() => { setReady(false); setMountError(true); }} />
      ) : null}
      {!unavailable ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} accessible={false}>
          <View style={[styles.scrim, { height: top + dimensions.button + spacing.md }]} />
          <View style={styles.guideRow} onLayout={({ nativeEvent: { layout } }) => {
            setGuideWidth(Math.min(layout.width * 0.84, layout.height * 0.82));
          }}>
            <View style={[styles.scrim, styles.side]} />
            <View style={[styles.guide, { width: guideWidth ?? "84%" }]}><Text style={styles.guideLabel}>Position your cat inside the guide</Text></View>
            <View style={[styles.scrim, styles.side]} />
          </View>
          <View style={[styles.scrim, { height: bottom + dimensions.capture + spacing.lg }]} />
        </View>
      ) : null}
      <View style={[styles.topRow, { top, left: Math.max(insets.left, spacing.md), right: Math.max(insets.right, spacing.md) }]}>
        <TouchableOpacity style={styles.scenario} onPress={() => { if (!lock.current) setSamplesVisible(true); }}
          disabled={reviewing} accessibilityState={{ disabled: reviewing }} accessibilityRole="button"
          accessibilityLabel={`Change simulated detection result. Mock result: ${resultLabel}`} activeOpacity={interaction.pressedOpacity}>
          <Text style={styles.lightCaption}>Mock result: {resultLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.roundButton} onPress={() => { if (!lock.current) setAvoidVisible(true); }}
          disabled={reviewing} accessibilityState={{ disabled: reviewing }} accessibilityRole="button" accessibilityLabel="What to Avoid">
          <Ionicons name="help-circle-outline" size={dimensions.icon} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
      {unavailable ? (
        <ScrollView style={[styles.stateArea, { top: top + dimensions.button + spacing.md, bottom: bottom + dimensions.capture + spacing.md }]}
          contentContainerStyle={styles.stateContent}>
          {!permission ? <ActivityIndicator accessibilityLabel="Checking camera permission" color={colors.textInverse} /> : <>
            <Text style={styles.stateTitle} accessibilityRole="header">{mountError ? "Camera unavailable" : "Camera access"}</Text>
            <Text style={styles.stateText}>{mountError ? "We couldn't start the camera. Try again or choose an existing photo."
              : permission.canAskAgain ? "Allow FeELINE to capture cat images for this research prototype. Results remain simulated."
              : "Camera access is disabled. Enable it in settings, or choose an existing photo."}</Text>
            <Button label={mountError ? "Retry Camera" : permission.canAskAgain ? "Allow Camera Access" : "Open Settings"}
              disabled={reviewing} onPress={mountError ? () => { setReady(false); setMountError(false); setCameraKey((key) => key + 1); }
                : permission.canAskAgain ? handlePermission : openSettings} fullWidth />
            <Button label="Choose from Gallery" disabled={reviewing} onPress={handleGallery} fullWidth />
          </>}
        </ScrollView>
      ) : null}
      {error ? <View style={[styles.error, { bottom: bottom + dimensions.capture + spacing.sm }]} accessibilityLiveRegion="polite">
        <Text style={styles.lightCaption} accessibilityRole="alert">{error}</Text>
        {gallerySettings ? <Button label="Open Settings" size="sm" onPress={openSettings} /> : null}
      </View> : null}
      <View style={[styles.controls, { bottom, paddingLeft: Math.max(insets.left, spacing.lg), paddingRight: Math.max(insets.right, spacing.lg) }]}>
        <TouchableOpacity style={styles.roundButton} disabled={reviewing} accessibilityState={{ disabled: reviewing }}
          onPress={handleGallery} accessibilityRole="button" accessibilityLabel="Choose image from gallery">
          {lastImage ? <MockPhoto imageUri={lastImage} size={dimensions.icon} label="Most recent camera or gallery image" />
            : <Ionicons name="images-outline" size={dimensions.icon} color={colors.textInverse} />}
        </TouchableOpacity>
        <CaptureButton onPress={handleCapture} disabled={reviewing || !ready || !permission?.granted || mountError || !focused || !appActive} />
        <View style={styles.spacer} />
      </View>
      {reviewing ? <View style={styles.processing} accessibilityLiveRegion="polite" accessibilityViewIsModal>
        <ActivityIndicator color={colors.textInverse} />
        <Text style={styles.stateText}>Reviewing observable cues…</Text>
        <Text style={styles.lightCaption}>Using the selected mock result for this prototype.</Text>
      </View> : null}
      <WhatToAvoidModal visible={avoidVisible} onClose={() => setAvoidVisible(false)} />
      <MockSampleModal visible={samplesVisible} selected={sampleId} onSelect={(id) => { if (!lock.current) setSampleId(id); }}
        onClose={() => setSamplesVisible(false)} />
    </FullBleedScreen>
  );
}

const styles = StyleSheet.create({
  topRow: { position: "absolute", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  scenario: { flexShrink: 1, minHeight: dimensions.touchTarget, justifyContent: "center", paddingHorizontal: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.cameraControl },
  roundButton: { width: dimensions.button, height: dimensions.button, borderRadius: radii.pill, overflow: "hidden", backgroundColor: colors.cameraControl, alignItems: "center", justifyContent: "center" },
  lightCaption: { ...typography.caption, color: colors.textInverse, textAlign: "center" },
  scrim: { backgroundColor: colors.cameraScrim },
  guideRow: { flex: 1, flexDirection: "row" },
  side: { flex: 1 },
  guide: { borderWidth: 1, borderColor: colors.cameraGuide, borderRadius: radii.xl, justifyContent: "flex-end", alignItems: "center", padding: spacing.sm },
  guideLabel: { ...typography.caption, color: colors.textInverse, backgroundColor: colors.cameraControl, borderRadius: radii.sm, padding: spacing.xs, textAlign: "center" },
  controls: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  spacer: { width: dimensions.button },
  stateArea: { position: "absolute", left: spacing.lg, right: spacing.lg },
  stateContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  stateTitle: { ...typography.subheading, color: colors.textInverse, textAlign: "center" },
  stateText: { ...typography.body, color: colors.textInverse, textAlign: "center" },
  error: { position: "absolute", left: spacing.md, right: spacing.md, padding: spacing.sm, gap: spacing.xs, borderRadius: radii.md, backgroundColor: colors.cameraControl },
  processing: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.cameraControl, alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.sm },
});
