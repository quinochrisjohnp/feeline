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

export default function WellnessReminderEditor({ cat, alert, reminder, onClose, onSave, onComplete, onDelete }: {
  cat: Cat; alert: WellnessAlert; reminder?: WellnessReminder; onClose(): void;
  onSave(at: string): Promise<void>; onComplete(): Promise<void>; onDelete(): Promise<void>;
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
    <WellnessCatHeader cat={cat} />
    <Text style={styles.title} accessibilityRole="header">{reminder ? "Your check-in reminder" : "Remind me later"}</Text>
    <Text style={styles.body}>{wellnessGuidance(cat.name, alert.rule).summary}</Text>
    <Text style={styles.body}>{date.toLocaleString()}</Text>
    {reminder ? <Text style={styles.caption}>Status: {reminder.status === "acknowledged" ? "Completed" : "Scheduled"}</Text> : null}
    {Platform.OS === "web" ? <TextInput accessibilityLabel="Reminder date and time (local)"
      placeholder="YYYY-MM-DDTHH:mm" defaultValue={date.getFullYear() + "-" + String(date.getMonth()+1).padStart(2,"0") + "-" + String(date.getDate()).padStart(2,"0") + "T" + String(date.getHours()).padStart(2,"0") + ":" + String(date.getMinutes()).padStart(2,"0")}
      onChangeText={value => setDate(new Date(value))} style={styles.input} /> : <View style={styles.actions}>
      <Button label="Choose date" variant="outline" onPress={() => pick("date")} disabled={busy} />
      <Button label="Choose time" variant="outline" onPress={() => pick("time")} disabled={busy} />
    </View>}
    {Platform.OS === "ios" && picker ? <View>
      <DateTimePicker value={date} mode={picker} display="spinner" onChange={(_,value) => { if (value) setDate(value); }} />
      <Button label="Done choosing" variant="text" onPress={() => setPicker(null)} />
    </View> : null}
    <Text style={styles.caption}>{notificationExplanation}</Text>
    <Text style={styles.caption}>Reminders stay on this device. If notifications are off, your reminder will still appear in Calendar.</Text>
    {error ? <Text style={styles.body} accessibilityRole="alert">{error}</Text> : null}
    <View style={styles.actions}>
      <Button label="Save reminder" onPress={save} loading={busy} fullWidth />
      <Button label="Cancel" variant="outline" onPress={onClose} disabled={busy} fullWidth />
      {reminder ? <>
        <Button label="Mark completed" variant="text" disabled={busy || reminder.status === "acknowledged"} onPress={() => action(onComplete)} />
        <Button label="Delete reminder" variant="text" disabled={busy} onPress={() => Alert.alert("Delete this reminder?",
          "Only this local reminder will be removed. Your cat and detection history will stay unchanged.",
          [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => action(onDelete) }])} />
      </> : null}
    </View>
  </ModalSurface>;
}
const styles = StyleSheet.create({
  title: { ...typography.subheading, fontFamily: fontFamily.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  body: { ...typography.body, fontFamily: fontFamily.body, color: colors.textSecondary, marginBottom: spacing.sm },
  caption: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary, marginVertical: spacing.sm },
  actions: { gap: spacing.sm, marginVertical: spacing.sm },
  input: { ...typography.body, borderWidth: 1, borderColor: colors.border, minHeight: 48, padding: spacing.sm },
});
