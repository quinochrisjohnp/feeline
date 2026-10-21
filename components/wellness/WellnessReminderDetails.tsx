import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ModalSurface from "@/components/common/ModalSurface";
import ModalHeader from "@/components/common/ModalHeader";
import Button from "@/components/common/Button";
import WellnessCatHeader from "./WellnessCatHeader";
import { wellnessDisclaimer, wellnessGuidance } from "@/constants/wellnessGuidance";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";
import type { Cat } from "@/types/models";
import type { WellnessAlert, WellnessReminder } from "@/types/wellness";
export default function WellnessReminderDetails({ cat, alert, reminder, onClose, onEdit, onAcknowledge, busy, error }: {
  cat: Cat; alert: WellnessAlert; reminder: WellnessReminder; onClose(): void; onEdit(): void;
  onAcknowledge(): void; busy: boolean; error: string | null;
}) {
  const date = new Date(reminder.scheduledAt);
  return <ModalSurface visible onClose={() => { if (!busy) onClose(); }}>
    <ModalHeader title="Check-in reminder" onClose={onClose} onEdit={onEdit} disabled={busy} />
    <WellnessCatHeader cat={cat} />
    <Text style={styles.body}>{date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</Text>
    <Text style={styles.body}>{date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text>
    <Text style={styles.body}>Status: {reminder.status === "acknowledged" ? "Completed" : "Scheduled"}</Text>
    <Text style={styles.body}>{wellnessGuidance(cat.name, alert.rule).summary}</Text>
    <Text style={styles.caption}>{wellnessDisclaimer}</Text>
    {error ? <Text style={styles.body} accessibilityRole="alert">{error}</Text> : null}
    <View style={styles.actions}>
      <Button label="Okay, I’ll check" size="compact" onPress={onAcknowledge} loading={busy} disabled={reminder.status === "acknowledged"} />
      <Button label="Remind me later" size="compact" variant="text" onPress={onEdit} disabled={busy} />
    </View>
  </ModalSurface>;
}
const styles = StyleSheet.create({
  body: { ...typography.body, fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: spacing.sm },
  caption: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, justifyContent: "flex-end", marginTop: spacing.md },
});
