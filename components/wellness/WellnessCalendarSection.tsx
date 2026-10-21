import WellnessReminderDetails from "./WellnessReminderDetails";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useCatData } from "@/context/CatDataContext";
import { useWellness } from "@/context/WellnessContext";
import { dueWellnessAlerts, remindersForDate } from "@/utils/wellnessState";
import { colors, fontFamily, radii, spacing, typography } from "@/constants/theme";
import WellnessCatHeader from "./WellnessCatHeader";
import WellnessCheckInModal from "./WellnessCheckInModal";
import WellnessReminderEditor from "./WellnessReminderEditor";

export default function WellnessCalendarSection({ date, catId, blocked, onOpenContext }: {
  date: Date; catId: string | null; blocked: boolean; onOpenContext(date: Date, catId: string): void;
}) {
  const wellness = useWellness(), { state: data } = useCatData(), focused = useIsFocused();
  const [selection, setSelection] = useState<{ signature: string; editor: boolean; details?: boolean } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    if (!focused || blocked || !wellness.ready || selection || AppState.currentState !== "active") return;
    const requested = wellness.state.alerts.find(a => a.signature === wellness.requestedSignature && data.cats.some(c => c.id === a.catId));
    const candidate = requested ?? dueWellnessAlerts(wellness.state, wellness.now)
      .find(a => (!catId || a.catId === catId) && !wellness.hasPresented(a.signature) && data.cats.some(c => c.id === a.catId));
    if (candidate) {
      wellness.markPresented(candidate.signature);
      setError(null);
      setSelection({ signature: candidate.signature, editor: false });
      if (requested) {
        const reminder = wellness.state.reminders.find(r => r.alertSignature === requested.signature);
        onOpenContext(new Date(reminder?.scheduledAt ?? requested.through), requested.catId);
        wellness.consumeRequest();
      }
    } else if (wellness.requestedSignature) wellness.consumeRequest();
  }, [focused, blocked, wellness, selection, data.cats, catId, onOpenContext]);
  const alert = wellness.state.alerts.find(a => a.signature === selection?.signature);
  const cat = data.cats.find(c => c.id === alert?.catId);
  const reminder = wellness.state.reminders.find(r => r.alertSignature === alert?.signature);
  const visible = focused && !blocked && AppState.currentState === "active";
  const close = () => { if (!busy) setSelection(null); };
  const acknowledge = async () => {
    if (!alert || lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try { await wellness.acknowledge(alert.signature); setSelection(null); }
    catch { setError("This check-in could not be saved locally. Please try again."); }
    finally { lock.current = false; setBusy(false); }
  };
  return <>
    {wellness.error ? <Text style={styles.caption} accessibilityRole="alert">{wellness.error}</Text> : null}
    {feedback ? <View style={styles.feedback}>
      <Text style={styles.caption} accessibilityLiveRegion="polite">{feedback}</Text>
      <TouchableOpacity style={styles.action} accessibilityRole="button" onPress={() => { void Linking.openSettings().catch(() => setFeedback("Open device Settings to change FeELINE notification access.")); }}>
        <Text style={styles.link}>Notification settings</Text>
      </TouchableOpacity>
    </View> : null}
    {remindersForDate(wellness.state, date, catId).map(item => {
      const reminderCat = data.cats.find(c => c.id === item.catId);
      if (!reminderCat) return null;
      return <TouchableOpacity key={item.id} style={styles.card} accessibilityRole="button"
        accessibilityLabel={"View check-in reminder for " + reminderCat.name}
        onPress={() => { wellness.markPresented(item.alertSignature); setError(null); setSelection({ signature: item.alertSignature, editor: false, details: true }); }}>
        <WellnessCatHeader cat={reminderCat} />
        <View style={styles.row}><Ionicons name="paw-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.label}>Check in with {reminderCat.name}</Text></View>
        <Text style={styles.caption}>{new Date(item.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {item.status === "acknowledged" ? "Completed" : "Scheduled"}</Text>
        {item.status === "scheduled" && item.notificationState !== "scheduled" ? <Text style={styles.caption}>Calendar reminder only · phone notifications {item.notificationState === "off" ? "off" : "not scheduled"}</Text> : null}
        <Text style={styles.link}>View reminder</Text>
      </TouchableOpacity>;
    })}
    {visible && alert && cat && selection ? selection.editor ? <WellnessReminderEditor
      key={alert.signature + "-editor"} cat={cat} alert={alert} reminder={reminder} onClose={close}
      onSave={async at => { const message = await wellness.saveReminder(alert.signature, at, cat.name); setFeedback(message); setSelection(null); }}

      onDelete={async () => { await wellness.acknowledge(alert.signature, true); setSelection(null); setFeedback("Local reminder deleted."); }} />
      : selection.details && reminder ? <WellnessReminderDetails cat={cat} alert={alert} reminder={reminder}
        onClose={close} onEdit={() => setSelection({ signature: alert.signature, editor: true })}
        onAcknowledge={acknowledge} busy={busy} error={error} />
      : <WellnessCheckInModal key={alert.signature} cat={cat} alert={alert} busy={busy} error={error}
        onClose={close} onAcknowledge={acknowledge} onRemind={() => setSelection({ signature: alert.signature, editor: true })} /> : null}
  </>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  label: { ...typography.label, fontFamily: fontFamily.heading, color: colors.textPrimary, flex: 1 },
  caption: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary, marginVertical: spacing.xxs },
  link: { ...typography.caption, fontFamily: fontFamily.medium, color: colors.textPrimary, textDecorationLine: "underline" },
  feedback: { marginBottom: spacing.sm }, action: { minHeight: 44, justifyContent: "center" },
});
