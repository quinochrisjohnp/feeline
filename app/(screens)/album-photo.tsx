import React, { useCallback, useEffect, useState } from "react";
import { Alert, BackHandler, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import EmptyState from "@/components/common/EmptyState";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmotionIcon from "@/components/common/EmotionIcon";
import EmotionResultCard from "@/components/camera/EmotionResultCard";
import { useCatData } from "@/context/CatDataContext";
import { formatFullDate, formatTime } from "@/utils/date";
import { selectAlbumById, selectImageById, selectDetectionForImage } from "@/context/catDataSelectors";
import MockPhoto from "@/components/common/MockPhoto";
import { colors, dimensions, fontFamily, spacing, typography } from "@/constants/theme";

// No real image assets exist yet in this mock phase, so there is nothing
// for Image.getSize to actually measure. Give each mock photo a stable,
// deterministic fallback aspect ratio derived from its own imageUri (same
// photo always renders the same shape) so contain/orientation behavior is
// demonstrable today. Once real URIs/assets exist, Image.getSize's success
// callback will fire with real dimensions and this fallback is never used.
const MOCK_ASPECT_RATIOS = [0.5, 0.75, 1, 1.6, 2.4]; // tall portrait, portrait, square, landscape, very wide
function mockAspectRatioFor(imageUri: string): number {
  let hash = 0;
  for (let i = 0; i < imageUri.length; i++) hash = (hash * 31 + imageUri.charCodeAt(i)) >>> 0;
  return MOCK_ASPECT_RATIOS[hash % MOCK_ASPECT_RATIOS.length];
}

interface Size { width: number; height: number }

export default function AlbumPhoto() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ imageId?: string; from?: string }>();
  const fromCalendar = params.from === "calendar";
  const imageId = typeof params.imageId === "string" ? params.imageId : "";
  const { state, deleteImage } = useCatData();

  const image = selectImageById(state, imageId);
  const record = image ? selectDetectionForImage(state, image.id) : null;

  const [showEmotion, setShowEmotion] = useState(fromCalendar);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletedNotice, setDeletedNotice] = useState(false);

  // Intrinsic photo dimensions (from Image.getSize, or the safe fallback).
  const [intrinsic, setIntrinsic] = useState<Size | null>(null);
  // Measured space actually available for the photo, from onLayout —
  // naturally recalculates on rotation/resize since RN re-fires onLayout.
  const [availableArea, setAvailableArea] = useState<Size | null>(null);

  // Resolve intrinsic size whenever the photo changes; ignore a stale
  // result if the user has moved to a different photo before it resolves.
  useEffect(() => {
    setIntrinsic(null);
    const uri = image?.imageUri;
    if (!uri) return;
    let cancelled = false;
    const applyFallback = () => {
      if (cancelled) return;
      const ratio = mockAspectRatioFor(uri);
      setIntrinsic({ width: 1000, height: Math.round(1000 / ratio) });
    };
    if (Image && typeof Image.getSize === "function") {
      try {
        Image.getSize(
          uri,
          (width, height) => { if (!cancelled) setIntrinsic({ width, height }); },
          applyFallback,
        );
      } catch {
        applyFallback();
      }
    } else {
      applyFallback();
    }
    return () => { cancelled = true; };
  }, [image?.imageUri]);

  const [parentAlbumId] = useState(image?.albumId ?? null);
  const availableAlbumId = image?.albumId ?? parentAlbumId;
  const parentExists = !!availableAlbumId && !!selectAlbumById(state, availableAlbumId);
  const backToAlbum = useCallback(() => {
    if (fromCalendar) router.dismissTo("/calendar");
    else if (parentExists && availableAlbumId) router.dismissTo({ pathname: "/album-folder", params: { albumId: availableAlbumId } });
    else router.dismissTo("/album");
  }, [availableAlbumId, parentExists, fromCalendar, router]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      backToAlbum();
      return true;
    });
    return () => subscription.remove();
  }, [backToAlbum]));

  if (deletedNotice) {
    return (
      <ScreenContainer module={fromCalendar ? "calendar" : "album"} edges={["left", "right", "bottom"]} padded={false}>
        <DetailScreenHeader transparent title="Photo" onBack={backToAlbum} />
        <ConfirmModal visible title="Image Deleted" confirmLabel="Continue" hideCancel
          onConfirm={backToAlbum} onCancel={backToAlbum} />
      </ScreenContainer>
    );
  }

  if (!image) {
    return (
      <ScreenContainer module={fromCalendar ? "calendar" : "album"} edges={["left", "right", "bottom"]} padded={false}>
        <DetailScreenHeader transparent title="Photo" onBack={backToAlbum} />
        <EmptyState icon="image-outline" title="Photo unavailable" message="This photo may have been deleted."
          actionLabel={fromCalendar ? "Back to Calendar" : parentExists ? "Back to album" : "Back to Cat Album"} onAction={backToAlbum} />
      </ScreenContainer>
    );
  }

  const handleDownload = () => {
    Alert.alert("Mock download", "This is a placeholder action. No file was downloaded to your device.");
  };

  const handleDeleteConfirm = () => {
    deleteImage(image.id);
    setConfirmingDelete(false);
    setDeletedNotice(true);
  };

  // Uniform "contain" scale: largest box preserving the original ratio that
  // fits inside the measured available area. The `1` cap never enlarges
  // the photo past its natural size.
  let displayWidth = 0;
  let displayHeight = 0;
  if (intrinsic && availableArea && availableArea.width > 0 && availableArea.height > 0) {
    const scale = Math.min(1, availableArea.width / intrinsic.width, availableArea.height / intrinsic.height);
    displayWidth = intrinsic.width * scale;
    displayHeight = intrinsic.height * scale;
  }
  const ready = intrinsic !== null && availableArea !== null;

  return (
    <ScreenContainer module={fromCalendar ? "calendar" : "album"} edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader transparent title={formatFullDate(image.capturedAt)} subtitle={formatTime(image.capturedAt)} onBack={backToAlbum} />

      <View
        style={styles.imageArea}
        onLayout={(event) => setAvailableArea({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
      >
        {ready ? (
          <View style={[styles.photo, { width: displayWidth, height: displayHeight }]}>
            <MockPhoto imageUri={image.imageUri} size={48} label="Captured mock photo" resizeMode="contain" />
          </View>
        ) : (
          <View style={styles.loadingPlaceholder} />
        )}
      </View>

      {showEmotion ? (
        <ScrollView style={styles.emotionScroll} contentContainerStyle={styles.emotionScrollContent} showsVerticalScrollIndicator={false}>
          {record ? (
            <EmotionResultCard emotionKey={record.emotion} confidence={record.confidence} />
          ) : (
            <Text style={styles.missingText}>No detection result is available for this mock photo.</Text>
          )}
        </ScrollView>
      ) : null}

      <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <TouchableOpacity style={styles.action} accessibilityRole="button" accessibilityLabel="Emotion"
          accessibilityState={{ expanded: showEmotion }} onPress={() => setShowEmotion((v) => !v)}>
          <EmotionIcon emotion={record?.emotion} size={22} />
          <Text style={styles.actionLabel}>Emotion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} accessibilityRole="button" accessibilityLabel="Download" onPress={handleDownload}>
          <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.actionLabel}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} accessibilityRole="button" accessibilityLabel="Delete" onPress={() => setConfirmingDelete(true)}>
          <Ionicons name="trash-outline" size={22} color={colors.dangerStrong} />
          <Text style={[styles.actionLabel, styles.actionLabelDanger]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={confirmingDelete}
        title="Delete this Photo?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmingDelete(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  imageArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  photo: {
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    // No borderRadius — square corners on the full photo, per spec.
  },
  loadingPlaceholder: { width: "60%", height: "60%", backgroundColor: colors.border },
  emotionScroll: { maxHeight: "45%" },
  emotionScrollContent: { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  toolbar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
  },
  action: { flex: 1, minHeight: dimensions.touchTarget, alignItems: "center", justifyContent: "center", gap: spacing.xxs, paddingVertical: spacing.xs },
  actionLabel: { ...typography.caption, fontFamily: fontFamily.semibold, color: colors.textPrimary },
  actionLabelDanger: { color: colors.dangerStrong },
  missingText: { ...typography.body, fontFamily: fontFamily.body, color: colors.textMuted, textAlign: "center", padding: spacing.lg },
});
