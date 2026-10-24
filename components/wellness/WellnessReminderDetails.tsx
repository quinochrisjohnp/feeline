import DialogActions from "@/components/common/DialogActions";
import React from "react";
import { StyleSheet, Text } from "react-native";
import ModalSurface from "@/components/common/ModalSurface";
import ModalHeader from "@/components/common/ModalHeader";
import WellnessCatHeader from "./WellnessCatHeader";
import { wellnessDisclaimer, wellnessGuidance } from "@/constants/wellnessGuidance";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";
import type { Cat } from "@/types/models";
import type { WellnessAlert, WellnessReminder } from "@/types/wellness";
export default function WellnessReminderDetails({ cat, alert, reminder, onClose, onEdit, due = false, busy = false, error, onDone }: {
  due?: boolean; busy?: boolean; error?: string | null; onDone?(): void;
  cat: Cat; alert: WellnessAlert; reminder: WellnessReminder; onClose(): void; onEdit(): void;
}) {
  const date = new Date(reminder.scheduledAt);
  return <ModalSurface visible onClose={onClose}>
    <ModalHeader title="Check-in reminder" onClose={onClose} onEdit={onEdit} />
    <WellnessCatHeader cat={cat} />
    <Text style={styles.body}>{date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</Text>
    <Text style={styles.body}>{date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text>
    <Text style={styles.body}>Status: <Text style={[styles.status, reminder.status === "acknowledged" && styles.completedStatus]}>{reminder.status === "acknowledged" ? "Completed" : "Scheduled"}</Text></Text>
    <Text style={styles.body}>{wellnessGuidance(cat.name, alert.rule).summary}</Text>
    <Text style={styles.caption}>{wellnessDisclaimer}</Text>
    {error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}
    {due && <DialogActions first={{ label: "Done", onPress: onDone, loading: busy }} second={{ label: "Remind me again", variant: "outline", onPress: onEdit, disabled: busy }} />}
  </ModalSurface>;
}
const styles = StyleSheet.create({
  status: { fontFamily: fontFamily.semibold, fontWeight: "600" },
  completedStatus: { color: colors.textPrimary },
  body: { ...typography.body, fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: spacing.sm },
  caption: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary },
});
