
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect, useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { claimCameraSessionTips, detectionFailureNotice, type CameraDetectionNotice } from "@/utils/cameraPresentation";

import FeelineLoadingOverlay from "@/components/loading/FeelineLoadingOverlay";
import { useWellness } from "@/context/WellnessContext";

import CaptureButton from "@/components/camera/CaptureButton";
import WhatToAvoidModal from "@/components/camera/WhatToAvoidModal";
import Button from "@/components/common/Button";
import FullBleedScreen from "@/components/common/FullBleedScreen";
import MockPhoto from "@/components/common/MockPhoto";

import {
  normalizeConfidence,
  normalizeEmotion,
  uploadDetection,
} from "@/services/detection";

import {
  colors,
  dimensions,
  getTabBarClearance,
  fontFamily,
  radii,
  spacing,
  typography,
} from "@/constants/theme";

type CaptureSource = "camera" | "gallery";

export default function Camera() {
  const router = useRouter();
  const { setCameraSafe } = useWellness();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission, refreshPermission] =
    useCameraPermissions();

  const camera = useRef<CameraView | null>(null);

  const [ready, setReady] = useState(false);
  const [mountError, setMountError] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);

  const [appActive, setAppActive] = useState(
    AppState.currentState === "active"
  );

  const [avoidVisible, setAvoidVisible] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [lastImage, setLastImage] = useState<string | null>(null);
  const [error, setError] = useState<string | CameraDetectionNotice | null>(null);
  const [gallerySettings, setGallerySettings] = useState(false);
  const [guideWidth, setGuideWidth] = useState<number | undefined>();

  const lock = useRef(false);
  const active = useRef(false);
  const generation = useRef(0);

  // PERFORMANCE MEASUREMENT
  const captureStartTime = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      active.current = true;
      if (claimCameraSessionTips()) setAvoidVisible(true);
      lock.current = false;

      setReviewing(false);
      setAnalyzing(false);
      setReady(false);
      setMountError(false);

      void refreshPermission().catch(() =>
        setError("Camera permission could not be checked. Please try again.")
      );

      return () => {
        active.current = false;
        generation.current += 1;
        lock.current = false;

        setReady(false);
        setReviewing(false);
        setAnalyzing(false);
        setAvoidVisible(false);
      };
    }, [refreshPermission])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");

      if (state !== "active") {
        setReady(false);
      } else if (active.current) {
        void refreshPermission().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [refreshPermission]);

  useEffect(() => {
    setCameraSafe(focused && appActive && permission !== null && !permissionBusy && !reviewing && !avoidVisible);
    return () => setCameraSafe(false);
  }, [focused, appActive, permission, permissionBusy, reviewing, avoidVisible, setCameraSafe]);

  const current = (ticket: number) =>
    active.current && generation.current === ticket;

  const unlock = (ticket: number) => {
    if (!current(ticket)) {
      return;
    }

    lock.current = false;
    setReviewing(false);
    setAnalyzing(false);
  };

  const begin = () => {
    if (!active.current || lock.current) {
      return null;
    }

    lock.current = true;
    setReviewing(true);
    setError(null);
    setGallerySettings(false);

    return generation.current;
  };

  // ==========================================================
  // Upload + DB save happens HERE automatically.
  // ==========================================================

  const processImage = async (
    uri: string,
    source: CaptureSource,
    ticket: number,
    startTimestamp?: number
  ): Promise<boolean> => {
    if (!current(ticket)) {
      return false;
    }

    setLastImage(uri);
    setAnalyzing(true);

    try {
      const uploadStart = performance.now();

      const detection = await uploadDetection(uri);

      const uploadEnd = performance.now();

      console.log(
        `[PERFORMANCE] Upload + backend response: ${(
          (uploadEnd - uploadStart) /
          1000
        ).toFixed(3)} seconds`
      );

      if (!current(ticket)) {
        return false;
      }

      const emotion = normalizeEmotion(detection.emotion);
      const confidence = normalizeConfidence(detection.confidence);

      const navigationStart = performance.now();

      setAnalyzing(false);
      setReviewing(false);
      lock.current = false;
      generation.current += 1;
      active.current = false;

      router.push({
        pathname: "/camera-result",
        params: {
          imageUri: detection.imageUrl,
          capturedAt: new Date().toISOString(),
          source,
          catId: detection.catId,
          imageId: detection.imageId,
          detectionId: detection.detectionId,
          emotion,
          confidence: String(confidence),
          recommendations: JSON.stringify(
            detection.recommendations ?? []
          ),

          // PERFORMANCE: pass capture start to result screen
          captureStartTimestamp:
            startTimestamp !== undefined
              ? String(startTimestamp)
              : "",
        },
      });

      console.log(
        `[PERFORMANCE] Navigation call: ${(
          (performance.now() - navigationStart) /
          1000
        ).toFixed(3)} seconds`
      );

      return true;
    } catch (uploadError) {
      console.error("Detection upload failed:", uploadError);

      if (current(ticket)) {
        setError(detectionFailureNotice(uploadError));

        unlock(ticket);
      }

      return false;
    } finally {
      if (current(ticket)) unlock(ticket);
    }
  };

  const handleCapture = async () => {
    if (!permission?.granted || !ready || !camera.current) {
      return;
    }

    const ticket = begin();

    if (ticket === null) {
      return;
    }

    // Start timing when the capture handler begins.
    const totalStart = performance.now();
    const startTimestamp = Date.now();

    captureStartTime.current = startTimestamp;

    try {
      const captureStart = performance.now();

      const photo = await camera.current.takePictureAsync({
        quality: 0.9,
      });

      const captureEnd = performance.now();

      console.log(
        `[PERFORMANCE] Camera capture: ${(
          (captureEnd - captureStart) /
          1000
        ).toFixed(3)} seconds`
      );

      if (!current(ticket)) {
        return;
      }

      if (!photo?.uri) {
        throw new Error("No photo");
      }

      const success = await processImage(
        photo.uri,
        "camera",
        ticket,
        startTimestamp
      );

      if (success) {
        console.log(
          `[PERFORMANCE] Capture to navigation call: ${(
            (performance.now() - totalStart) /
            1000
          ).toFixed(3)} seconds`
        );
      }
    } catch (captureError) {
      console.error("Camera capture failed:", captureError);

      if (current(ticket)) {
        setError(
          "We couldn't capture that photo. Please try again or choose one from your gallery."
        );

        unlock(ticket);
      }
    }
  };

  const handleGallery = async () => {
    const ticket = begin();

    if (ticket === null) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 1,
      });

      if (!current(ticket)) {
        return;
      }

      if (result.canceled) {
        unlock(ticket);
        return;
      }

      const uri = result.assets?.[0]?.uri;

      if (!uri) {
        throw new Error("No selected image");
      }

      // Gallery timing starts after image selection.
      const startTimestamp = Date.now();

      console.log(
        "[PERFORMANCE] Gallery image selected; starting detection timer"
      );

      await processImage(
        uri,
        "gallery",
        ticket,
        startTimestamp
      );
    } catch (galleryError) {
      console.error("Gallery error:", galleryError);

      if (!current(ticket)) {
        return;
      }

      setError(
        "We couldn't open or process that photo. Try the gallery again, or check photo access in device settings."
      );

      setGallerySettings(Platform.OS !== "web");
      unlock(ticket);
    }
  };

  const handlePermission = async () => {
    if (lock.current) {
      return;
    }

    lock.current = true;

    try {
      setPermissionBusy(true);
      await requestPermission();
    } catch {
      setError(
        "Camera access could not be requested. Please try again or use your gallery."
      );
    } finally {
      lock.current = false;
      setPermissionBusy(false);
    }
  };

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      setError(
        "Open your device settings and allow camera or photo access for FeELINE."
      );
    }
  };

  const unavailable = !permission?.granted || mountError;
  const bottom = getTabBarClearance(insets.bottom);
  const top = insets.top + spacing.sm;
  const notice = typeof error === "string"
    ? { title: gallerySettings ? "Photo access" : "Camera notice", message: error, photoTips: false }
    : error;

  return (
    <FullBleedScreen statusBarStyle={focused ? "light" : "auto"}>
      {focused && appActive && permission?.granted && !mountError ? (
        <CameraView
          key={cameraKey}
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
          onCameraReady={() => {
            if (active.current) {
              setReady(true);
            }
          }}
          onMountError={() => {
            setReady(false);
            setMountError(true);
          }}
        />
      ) : null}

      {!unavailable ? (
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          accessible={false}
        >
          <View
            style={[
              styles.scrim,
              {
                height: top + dimensions.button + spacing.md,
              },
            ]}
          />

          <View
            style={styles.guideRow}
            onLayout={({ nativeEvent: { layout } }) => {
              setGuideWidth(
                Math.min(
                  layout.width * 0.84,
                  layout.height * 0.82
                )
              );
            }}
          >
            <View style={[styles.scrim, styles.side]} />

            <View
              style={[
                styles.guide,
                {
                  width: guideWidth ?? "84%",
                },
              ]}
            >
              <Text style={styles.guideLabel}>
                Position your cat inside the guide
              </Text>
            </View>

            <View style={[styles.scrim, styles.side]} />
          </View>

          <View
            style={[
              styles.scrim,
              {
                height: bottom + dimensions.capture + spacing.lg,
              },
            ]}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.topRow,
          {
            top,
            left: Math.max(insets.left, spacing.md),
            right: Math.max(insets.right, spacing.md),
          },
        ]}
      >
        <View />

        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => {
            if (!lock.current) {
              setAvoidVisible(true);
            }
          }}
          disabled={reviewing}
          accessibilityState={{
            disabled: reviewing,
          }}
          accessibilityRole="button"
          accessibilityLabel="What to Avoid"
        >
          <Ionicons
            name="help-circle-outline"
            size={dimensions.icon}
            color={colors.textInverse}
          />
        </TouchableOpacity>
      </View>

      {unavailable ? (
        <ScrollView
          style={[
            styles.stateArea,
            {
              top: top + dimensions.button + spacing.md,
              bottom: bottom + dimensions.capture + spacing.md,
            },
          ]}
          contentContainerStyle={styles.stateContent}
        >
          {!permission ? (
            <ActivityIndicator
              accessibilityLabel="Checking camera permission"
              color={colors.textInverse}
            />
          ) : (
            <>
              <Text
                style={styles.stateTitle}
                accessibilityRole="header"
              >
                {mountError ? "Camera unavailable" : "Camera access"}
              </Text>

              <Text style={styles.stateText}>
                {mountError
                  ? "We couldn't start the camera. Try again or choose an existing photo."
                  : permission.canAskAgain
                    ? "Allow FeELINE to capture cat images for emotion detection."
                    : "Camera access is disabled. Enable it in settings, or choose an existing photo."}
              </Text>

              <Button
                label={
                  mountError
                    ? "Retry Camera"
                    : permission.canAskAgain
                      ? "Allow Camera Access"
                      : "Open Settings"
                }
                disabled={reviewing}
                onPress={
                  mountError
                    ? () => {
                        setReady(false);
                        setMountError(false);
                        setCameraKey((key) => key + 1);
                      }
                    : permission.canAskAgain
                      ? handlePermission
                      : openSettings
                }
                fullWidth
              />

              <Button
                label="Choose from Gallery"
                disabled={reviewing}
                onPress={handleGallery}
                fullWidth
              />
            </>
          )}
        </ScrollView>
      ) : null}

      {notice ? (
        <View
          style={[
            styles.error,
            {
              bottom: bottom + dimensions.capture + spacing.sm,
              left: Math.max(insets.left, spacing.md),
              right: Math.max(insets.right, spacing.md),
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.noticeHeading}>
            <Ionicons name={notice.photoTips ? "camera-outline" : "alert-circle-outline"}
              size={dimensions.iconSmall} color={colors.textInverse} accessible={false} />
            <Text style={styles.noticeTitle} accessibilityRole="alert">{notice.title}</Text>
          </View>
          <Text style={styles.noticeMessage}>{notice.message}</Text>
          {notice.photoTips ? (
            <TouchableOpacity style={styles.tipsAction} accessibilityRole="button"
              accessibilityLabel="View photo tips" onPress={() => setAvoidVisible(true)}>
              <Text style={styles.tipsLabel}>View photo tips</Text>
            </TouchableOpacity>
          ) : null}

          {gallerySettings ? (
            <Button
              label="Open Settings"
              size="sm"
              onPress={openSettings}
            />
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.controls,
          {
            bottom,
            paddingLeft: Math.max(insets.left, spacing.lg),
            paddingRight: Math.max(insets.right, spacing.lg),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.roundButton}
          disabled={reviewing}
          accessibilityState={{
            disabled: reviewing,
          }}
          onPress={handleGallery}
          accessibilityRole="button"
          accessibilityLabel="Choose image from gallery"
        >
          {lastImage ? (
            <MockPhoto
              imageUri={lastImage}
              size={dimensions.icon}
              label="Most recent camera or gallery image"
            />
          ) : (
            <Ionicons
              name="images-outline"
              size={dimensions.icon}
              color={colors.textInverse}
            />
          )}
        </TouchableOpacity>

        <CaptureButton
          onPress={handleCapture}
          disabled={
            reviewing ||
            !ready ||
            !permission?.granted ||
            mountError ||
            !focused ||
            !appActive
          }
        />

        <View style={styles.spacer} />
      </View>

      {analyzing && focused ? <FeelineLoadingOverlay /> : null}

      <WhatToAvoidModal
        visible={avoidVisible}
        onClose={() => setAvoidVisible(false)}
      />
    </FullBleedScreen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  roundButton: {
    width: dimensions.button,
    height: dimensions.button,
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: colors.cameraControl,
    alignItems: "center",
    justifyContent: "center",
  },

  lightCaption: {
    ...typography.caption,
    color: colors.textInverse,
    textAlign: "center",
  },

  scrim: {
    backgroundColor: colors.cameraScrim,
  },

  guideRow: {
    flex: 1,
    flexDirection: "row",
  },

  side: {
    flex: 1,
  },

  guide: {
    borderWidth: 1,
    borderColor: colors.cameraGuide,
    borderRadius: radii.xl,
    justifyContent: "flex-end",
    alignItems: "center",
    padding: spacing.sm,
  },

  guideLabel: {
    ...typography.caption,
    color: colors.textInverse,
    backgroundColor: colors.cameraControl,
    borderRadius: radii.sm,
    padding: spacing.xs,
    textAlign: "center",
  },

  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  spacer: {
    width: dimensions.button,
  },

  stateArea: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
  },

  stateContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },

  stateTitle: {
    ...typography.subheading,
    color: colors.textInverse,
    textAlign: "center",
  },

  stateText: {
    ...typography.body,
    color: colors.textInverse,
    textAlign: "center",
  },

  noticeHeading: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  noticeTitle: { ...typography.label, fontFamily: fontFamily.heading, color: colors.textInverse, flex: 1 },
  noticeMessage: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textInverse },
  tipsAction: { minHeight: dimensions.touchTarget, justifyContent: "center", alignSelf: "flex-start" },
  tipsLabel: { ...typography.caption, fontFamily: fontFamily.medium, color: colors.textInverse, textDecorationLine: "underline" },

  error: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    padding: spacing.sm,
    gap: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.cameraControl,
  },

  processing: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cameraControl,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
