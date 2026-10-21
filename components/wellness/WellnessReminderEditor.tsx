import FormField from "@/components/common/FormField";
import ModalHeader from "@/components/common/ModalHeader";
import React, { useRef, useState } from "react";
import { Alert, Platform, StyleSheet, Text, View, TextInput } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import ModalSurface from "@/components/common/ModalSurface";
import Button from "@/components/common/Button";
import WellnessCatHeader from "./WellnessCatHeader";
import type { Cat } from "@/types/models";
import type { WellnessAlert, WellnessReminder } from "@/types/wellness";
import { notificationExplanation, wellnessGuidance } from "@/constants/wellnessGuidance";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";

export default function WellnessReminderEditor({ cat, alert, reminder, onClose, onSave, onDelete }: {
  cat: Cat; alert: WellnessAlert; reminder?: WellnessReminder; onClose(): void;
  onSave(at: string): Promise<void>; onDelete(): Promise<void>;
}) {
  const [date, setDate] = useState(() => reminder ? new Date(reminder.scheduledAt) : new Date(Date.now() + 3600000));
  const [picker, setPicker] = useState<"date" | "time" | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const action = async (work: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try { await work(); } catch (e) { setError(e instanceof Error ? e.message : "The reminder could not be saved. Please try again."); }
    finally { lock.current = false; setBusy(false); }
  };
  const pick = (mode: "date" | "time") => {
    if (Platform.OS === "android") DateTimePickerAndroid.open({
      value: date, mode, onChange: (event, value) => { if (event.type === "set" && value) setDate(value); },
    });
    else setPicker(mode);
  };
  const save = () => action(async () => {
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error("Choose a future date and time.");
    await onSave(date.toISOString());
  });
  return <ModalSurface visible onClose={() => { if (!busy) onClose(); }}>
    <ModalHeader title={reminder ? "Edit reminder" : "Remind me later"} onClose={onClose} disabled={busy} />
    <WellnessCatHeader cat={cat} />
    <Text style={styles.body}>{wellnessGuidance(cat.name, alert.rule).summary}</Text>
    <Text style={styles.body}>{date.toLocaleString()}</Text>
    {reminder ? <Text style={styles.caption}>Status: {reminder.status === "acknowledged" ? "Completed" : "Scheduled"}</Text> : null}
    {Platform.OS === "web" ? <TextInput accessibilityLabel="Reminder date and time (local)"
      placeholder="YYYY-MM-DDTHH:mm" defaultValue={date.getFullYear() + "-" + String(date.getMonth()+1).padStart(2,"0") + "-" + String(date.getDate()).padStart(2,"0") + "T" + String(date.getHours()).padStart(2,"0") + ":" + String(date.getMinutes()).padStart(2,"0")}
      onChangeText={value => setDate(new Date(value))} style={styles.input} /> : <View style={styles.actions}>
      <FormField label="Date" value={date.toLocaleDateString()} onSelect={() => pick("date")} disabled={busy} />
      <FormField label="Time" value={date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} onSelect={() => pick("time")} disabled={busy} />
    </View>}
    {Platform.OS === "ios" && picker ? <View>
      <DateTimePicker value={date} mode={picker} display="spinner" onChange={(_,value) => { if (value) setDate(value); }} />
      <Button label="Done choosing" variant="text" onPress={() => setPicker(null)} />
    </View> : null}
    <Text style={styles.caption}>{notificationExplanation}</Text>
    <Text style={styles.caption}>Reminders stay on this device. If notifications are off, your reminder will still appear in Calendar.</Text>
    {error ? <Text style={styles.body} accessibilityRole="alert">{error}</Text> : null}
    <View style={styles.actions}>
      <Button label={reminder ? "Save changes" : "Save reminder"} size="compact" onPress={save} loading={busy} />
      <Button label="Cancel" variant="text" size="compact" onPress={onClose} disabled={busy} />
      {reminder ? <>
        <Button label="Delete reminder" variant="dangerText" size="compact" style={styles.deleteAction} disabled={busy} onPress={() => Alert.alert("Delete this reminder?",
          "Only this local reminder will be removed. Your cat and detection history will stay unchanged.",
          [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => action(onDelete) }])} />
      </> : null}
    </View>
  </ModalSurface>;
}
const styles = StyleSheet.create({
  title: { ...typography.subheading, fontFamily: fontFamily.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  body: { ...typography.body, fontSize: 15, lineHeight: 22, fontFamily: fontFamily.body, color: colors.textSecondary, marginBottom: spacing.sm },
  caption: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary, marginVertical: spacing.sm },
  deleteAction: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md },
  actions: { gap: spacing.sm, marginVertical: spacing.sm },
  input: { ...typography.body, borderWidth: 1, borderColor: colors.border, minHeight: 48, padding: spacing.sm },
});
