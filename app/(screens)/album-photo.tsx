import React, { useCallback, useState } from "react";
import { Alert, BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import EmptyState from "@/components/common/EmptyState";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmotionResultCard from "@/components/camera/EmotionResultCard";
import { useCatData } from "@/context/CatDataContext";
import { formatFullDate, formatTime } from "@/utils/date";
import { selectAlbumById, selectImageById, selectDetectionForImage } from "@/context/catDataSelectors";
import MockPhoto from "@/components/common/MockPhoto";
import { colors, dimensions, fonts, spacing, typography } from "@/constants/theme";

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
      <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
        <DetailScreenHeader title="Photo" onBack={backToAlbum} />
        <ConfirmModal visible title="Image Deleted" confirmLabel="Continue" hideCancel
          onConfirm={backToAlbum} onCancel={backToAlbum} />
      </ScreenContainer>
    );
  }

  if (!image) {
    return (
      <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
        <DetailScreenHeader title="Photo" onBack={backToAlbum} />
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

  return (
    <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader title={formatFullDate(image.capturedAt)} subtitle={formatTime(image.capturedAt)} onBack={backToAlbum} />

      <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sized from available width/height rather than a fixed aspect ratio,
            so a future real <Image> can report its own intrinsic ratio here
            without a layout rewrite. Square (sharp) corners per spec. */}
        <View style={styles.photo}>
          <MockPhoto imageUri={image.imageUri} size={48} label="Captured mock photo" />
        </View>

        {showEmotion && record && (
          <View style={styles.emotionWrapper}>
            <EmotionResultCard emotionKey={record.emotion} confidence={record.confidence} />
          </View>
        )}
        {showEmotion && !record ? <Text style={styles.missingText}>No detection result is available for this mock photo.</Text> : null}
      </ScrollView>

      <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <TouchableOpacity style={styles.action} accessibilityRole="button" accessibilityLabel="Emotion"
          accessibilityState={{ expanded: showEmotion }} onPress={() => setShowEmotion((v) => !v)}>
          <Ionicons name="happy-outline" size={22} color={colors.textPrimary} />
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
  scrollFlex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  photo: {
    flex: 1,
    minHeight: 280,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    // No borderRadius here — the full photo must have square corners.
  },
  toolbar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
  },
  action: { flex: 1, minHeight: dimensions.touchTarget, alignItems: "center", justifyContent: "center", gap: spacing.xxs, paddingVertical: spacing.xs },
  actionLabel: { ...typography.caption, fontFamily: fonts.albumBody, color: colors.textPrimary },
  actionLabelDanger: { color: colors.dangerStrong },
  emotionWrapper: { marginTop: spacing.sm },
  missingText: { ...typography.body, fontFamily: fonts.albumBody, color: colors.textMuted, textAlign: "center", padding: spacing.lg },
});