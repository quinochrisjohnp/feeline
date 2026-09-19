import React, { useCallback, useState } from "react";
import { Alert, BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import EmptyState from "@/components/common/EmptyState";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmotionResultCard from "@/components/camera/EmotionResultCard";
import { useCatData } from "@/context/CatDataContext";
import { formatFullDate, formatTime } from "@/utils/date";
import { selectAlbumById, selectImageById, selectDetectionForImage } from "@/context/catDataSelectors";
import MockPhoto from "@/components/common/MockPhoto";
import { colors, dimensions, radii, spacing, typography } from "@/constants/theme";

export default function AlbumPhoto() {
  const router = useRouter();
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
    <ScreenContainer
      edges={["left", "right", "bottom"]}
      padded={false}
    >
      <DetailScreenHeader title={formatFullDate(image.capturedAt)} subtitle={formatTime(image.capturedAt)} onBack={backToAlbum} />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>

      <View style={styles.photo}>
        <MockPhoto imageUri={image.imageUri} size={48} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} accessibilityRole="button" accessibilityLabel="Emotion" accessibilityState={{ expanded: showEmotion }} onPress={() => setShowEmotion((v) => !v)}>
          <Ionicons name="happy-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.actionLabel}>Emotion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} accessibilityRole="button" accessibilityLabel="Download" onPress={handleDownload}>
          <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.actionLabel}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} accessibilityRole="button" accessibilityLabel="Delete" onPress={() => setConfirmingDelete(true)}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
          <Text style={[styles.actionLabel, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {showEmotion && record && (
        <View style={styles.emotionWrapper}>
          <EmotionResultCard emotionKey={record.emotion} confidence={record.confidence} />
        </View>
      )}

      {showEmotion && !record ? <Text style={styles.missingText}>No detection result is available for this mock photo.</Text> : null}
      </ScrollView>
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
  photo: {
    marginHorizontal: spacing.lg,
    aspectRatio: 0.85,
    marginTop: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly", marginTop: spacing.lg, marginBottom: spacing.md },
  action: { flexGrow: 1, flexBasis: 80, minHeight: dimensions.touchTarget, padding: spacing.xs, alignItems: "center", gap: 4 },
  actionLabel: { ...typography.caption, color: colors.textPrimary },
  emotionWrapper: { marginTop: spacing.sm },
  missingText: { ...typography.body, color: colors.textMuted, textAlign: "center", padding: spacing.lg },
});
