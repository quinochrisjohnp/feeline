import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MockPhoto from "@/components/common/MockPhoto";
import EmotionIcon from "@/components/common/EmotionIcon";
import Button from "@/components/common/Button";
import { EMOTIONS, type DetectionRecord } from "@/types/models";
import { formatFullDate, formatTime } from "@/utils/date";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";
export default function DetectionPhotoViewer({ uri, record, catName, capturedAt, onClose, onDownload }: {
  uri: string; record?: DetectionRecord; catName: string; capturedAt: string; onClose(): void; onDownload(): void;
}) {
  return <SafeAreaView style={styles.root}>
    <View style={styles.header}>
      <Text style={styles.title}>Detection photo</Text>
      <Button variant="icon" label="Close photo" onPress={onClose}
        leftIcon={<Ionicons name="close" size={22} color={colors.textPrimary} />} />
    </View>
    <View style={styles.photo} testID="calendar-photo-main">
      <MockPhoto size={48} imageUri={uri} resizeMode="contain" label={catName + " detection photo"} />
    </View>
    <ScrollView style={styles.details} contentContainerStyle={styles.detailContent}>
      <View style={styles.row}>
        <EmotionIcon emotion={record?.emotion} size={28} />
        <Text style={styles.label}>{record ? EMOTIONS[record.emotion].label + " · " + record.confidence + "%" : "Result unavailable"}</Text>
        <Button variant="icon" label="Download" onPress={onDownload}
          leftIcon={<Ionicons name="download-outline" size={20} color={colors.textPrimary} />} />
      </View>
      <Text style={styles.body}>{catName}</Text>
      <Text style={styles.caption}>{formatFullDate(capturedAt)} · {formatTime(capturedAt)}</Text>
      <Text style={styles.caption}>Observable cues, not a veterinary diagnosis.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md },
  title: { ...typography.label, fontFamily: fontFamily.heading, color: colors.textPrimary, flex: 1 },
  photo: { flex: 1, minHeight: 0, backgroundColor: colors.black },
  details: { flexGrow: 0, maxHeight: "30%" },
  detailContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  label: { ...typography.label, fontFamily: fontFamily.medium, color: colors.textPrimary, flex: 1 },
  body: { ...typography.label, fontFamily: fontFamily.body, color: colors.textPrimary },
  caption: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary },
});
