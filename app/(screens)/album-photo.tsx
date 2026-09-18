import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmotionResultCard from "@/components/camera/EmotionResultCard";
import { useCatData } from "@/context/CatDataContext";
import { formatFullDate, formatTime } from "@/utils/date";
import { colors, radii, spacing, typography } from "@/constants/theme";

export default function AlbumPhoto() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recordId?: string }>();
  const recordId = params.recordId ?? "";
  const { detectionRecords, deleteDetectionRecord } = useCatData();

  const record = detectionRecords.find((r) => r.id === recordId) ?? null;

  const [showEmotion, setShowEmotion] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletedNotice, setDeletedNotice] = useState(false);

  if (!record) {
    return (
      <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
        <DetailScreenHeader title="Photo" />
        <View style={styles.center}>
          <Text style={styles.missingText}>This photo is no longer available.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleDownload = () => {
    Alert.alert("Download", "Saving to device is coming soon.");
  };

  const handleDeleteConfirm = () => {
    deleteDetectionRecord(record.id);
    setConfirmingDelete(false);
    setDeletedNotice(true);
  };

  const handleContinueAfterDelete = () => {
    setDeletedNotice(false);
    router.back();
  };

  return (
    <ScreenContainer
      scroll
      edges={["left", "right", "bottom"]}
      padded={false}
      contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}
    >
      <DetailScreenHeader title={formatFullDate(record.recordedAt)} subtitle={formatTime(record.recordedAt)} />

      <View style={styles.photo}>
        <Ionicons name="image-outline" size={48} color={colors.textMuted} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={() => setShowEmotion((v) => !v)}>
          <Ionicons name="happy-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.actionLabel}>Emotion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={handleDownload}>
          <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.actionLabel}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => setConfirmingDelete(true)}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
          <Text style={[styles.actionLabel, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {showEmotion && (
        <View style={styles.emotionWrapper}>
          <EmotionResultCard emotionKey={record.emotion} confidence={record.confidence} />
        </View>
      )}

      <ConfirmModal
        visible={confirmingDelete}
        title="Delete this Photo?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmingDelete(false)}
      />

      <ConfirmModal
        visible={deletedNotice}
        title="Image Deleted"
        confirmLabel="Continue"
        hideCancel
        onConfirm={handleContinueAfterDelete}
        onCancel={handleContinueAfterDelete}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  photo: {
    marginHorizontal: spacing.lg,
    height: 380,
    borderRadius: radii.lg,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", justifyContent: "space-evenly", marginTop: spacing.lg, marginBottom: spacing.md },
  action: { alignItems: "center", gap: 4 },
  actionLabel: { ...typography.caption, color: colors.textPrimary },
  emotionWrapper: { marginTop: spacing.sm },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  missingText: { ...typography.body, color: colors.textMuted, textAlign: "center" },
});