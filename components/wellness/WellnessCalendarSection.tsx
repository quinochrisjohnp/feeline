import DialogActions from "@/components/common/DialogActions";
import ConfirmModal from "@/components/common/ConfirmModal";
import WellnessReminderDetails from "./WellnessReminderDetails";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { usePathname } from "expo-router";
import ModalSurface from "@/components/common/ModalSurface";
import Button from "@/components/common/Button";
import { Ionicons } from "@expo/vector-icons";
import { useCatData } from "@/context/CatDataContext";
import { useWellness } from "@/context/WellnessContext";
import { dueWellnessAlerts, remindersForDate } from "@/utils/wellnessState";
import { colors, fontFamily, radii, spacing, typography } from "@/constants/theme";
import WellnessCatHeader from "./WellnessCatHeader";
import WellnessCheckInModal from "./WellnessCheckInModal";
import WellnessReminderEditor from "./WellnessReminderEditor";

export default function WellnessCalendarSection({ date, catId, blocked, global = false }: {
  global?: boolean;
  date: Date; catId: string | null; blocked: boolean; onOpenContext(date: Date, catId: string): void;
}) {
  const wellness = useWellness(), { state: data } = useCatData(), focused = usePathname() === "/calendar";
  const [selection, setSelection] = useState<{ signature: string; editor: boolean } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const lock = useRef(false);
  const claiming = useRef(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savedCat, setSavedCat] = useState<string | null>(null);
  const visible = global ? wellness.canPresent : focused && !blocked && AppState.currentState === "active";
  useEffect(() => {
    if (!global || !visible || !wellness.ready || selection || feedback || savedCat || claiming.current) return;
    const requested = dueWellnessAlerts(wellness.state, wellness.now).find(a => a.signature === wellness.requestedSignature && !wellness.hasPresented(a.signature) && data.cats.some(c => c.id === a.catId));
    const candidate = requested ?? dueWellnessAlerts(wellness.state, wellness.now)
      .find(a => !wellness.hasPresented(a.signature) && data.cats.some(c => c.id === a.catId));
    if (candidate) {
      claiming.current = true;
      void wellness.claimPresentation(candidate.signature).then(claimed => {
        if (claimed) { setError(null); setSelection({ signature: candidate.signature, editor: false }); }
        if (requested) wellness.consumeRequest();
      }).catch(() => setError("This check-in could not be saved locally. Please reopen the app to retry."))
        .finally(() => { claiming.current = false; });
    } else if (wellness.requestedSignature) wellness.consumeRequest();
  }, [global, visible, wellness, selection, feedback, savedCat, data.cats]);
  useEffect(() => {
    if (selection && wellness.requestedSignature === selection.signature) wellness.consumeRequest();
  }, [selection, wellness]);
  const alert = wellness.state.alerts.find(a => a.signature === selection?.signature);
  const cat = data.cats.find(c => c.id === alert?.catId);
  const reminder = wellness.state.reminders.find(r => r.alertSignature === alert?.signature);
  useEffect(() => { if (selection && (!alert || !cat)) setSelection(null); }, [selection, alert, cat]);
  const close = () => { if (!busy) setSelection(null); };
  const acknowledge = async () => {
    if (!alert || lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try { await wellness.acknowledge(alert.signature); setSelection(null); }
    catch { setError("This check-in could not be saved locally. Please try again."); }
    finally { lock.current = false; setBusy(false); }
  };
  return <>
    <ConfirmModal visible={visible && !!savedCat} title="Reminder saved" message={`We’ll remind you to check in with ${savedCat} at the time you selected.\n\nPlease make sure your phone’s notification settings is turned on.`} onConfirm={() => setSavedCat(null)} onCancel={() => setSavedCat(null)}
      actions={<DialogActions
        first={{ label: "Continue", onPress: () => setSavedCat(null) }}
        second={{ label: "Check notification", variant: "outline", onPress: () => {
          setSettingsError(null);
          void Linking.openSettings().catch(() => setSettingsError("Open your phone’s Settings, choose FeELINE, then Notifications."));
        } }}
      />}>
      {settingsError && <Text style={styles.caption} accessibilityRole="alert">{settingsError}</Text>}
    </ConfirmModal>
    {global && visible && feedback ? <ModalSurface visible onClose={() => setFeedback(null)}>
      <Text style={styles.caption} accessibilityLiveRegion="polite">{feedback}</Text>
      <Button label="Continue" onPress={() => setFeedback(null)} />
    </ModalSurface> : null}
    {!global && wellness.error ? <Text style={styles.caption} accessibilityRole="alert">{wellness.error}</Text> : null}
    {!global && feedback ? <View style={styles.feedback}>
      <Text style={styles.caption} accessibilityLiveRegion="polite">{feedback}</Text>
      <TouchableOpacity style={styles.action} accessibilityRole="button" onPress={() => { void Linking.openSettings().catch(() => setFeedback("Open device Settings to change FeELINE notification access.")); }}>
        <Text style={styles.link}>Notification settings</Text>
      </TouchableOpacity>
    </View> : null}
    {!global && remindersForDate(wellness.state, date, catId).map(item => {
      const reminderCat = data.cats.find(c => c.id === item.catId);
      if (!reminderCat) return null;
      return <TouchableOpacity key={item.id} style={styles.card} accessibilityRole="button"
        accessibilityLabel={"View check-in reminder for " + reminderCat.name}
        onPress={() => { wellness.markPresented(item.alertSignature); setError(null); setSelection({ signature: item.alertSignature, editor: false }); }}>
        <WellnessCatHeader cat={reminderCat} />
        <View style={styles.row}><Ionicons name="paw-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.label}>Check in with {reminderCat.name}</Text></View>
        <Text style={styles.caption}>{new Date(item.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · <Text style={[styles.status, item.status === "acknowledged" && styles.completedStatus]}>{item.status === "acknowledged" ? "Completed" : "Scheduled"}</Text></Text>
        {item.status === "scheduled" && item.notificationState !== "scheduled" ? <Text style={styles.caption}>Calendar reminder only · phone notifications {item.notificationState === "off" ? "off" : "not scheduled"}</Text> : null}
        <Text style={styles.link}>View reminder</Text>
      </TouchableOpacity>;
    })}
    {visible && alert && cat && selection ? selection.editor ? <WellnessReminderEditor
      key={alert.signature + "-editor"} cat={cat} alert={alert} reminder={reminder} onClose={close}
      onSave={async at => { await wellness.saveReminder(alert.signature, at, cat.name); setSettingsError(null); setSavedCat(cat.name); setSelection(null); }}

      onDelete={async () => { await wellness.acknowledge(alert.signature, true); setSelection(null); setFeedback("Local reminder deleted."); }} />
      : reminder ? <WellnessReminderDetails due={global} busy={busy} error={error} onDone={acknowledge} cat={cat} alert={alert} reminder={reminder}
        onClose={close} onEdit={() => setSelection({ signature: alert.signature, editor: true })} />
      : <WellnessCheckInModal key={alert.signature} cat={cat} alert={alert} busy={busy} error={error}
        onClose={close} onAcknowledge={acknowledge} onRemind={() => setSelection({ signature: alert.signature, editor: true })} /> : null}
  </>;
}
const styles = StyleSheet.create({
  status: { fontFamily: fontFamily.semibold, fontWeight: "600" },
  completedStatus: { color: colors.textPrimary },
  title: { ...typography.subheading, fontFamily: fontFamily.heading, color: colors.textPrimary, textAlign: "center" },
  card: { backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  label: { ...typography.label, fontFamily: fontFamily.heading, color: colors.textPrimary, flex: 1 },
  caption: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary, marginVertical: spacing.xxs },
  link: { ...typography.caption, fontFamily: fontFamily.medium, color: colors.textPrimary, textDecorationLine: "underline" },
  feedback: { marginBottom: spacing.sm }, action: { minHeight: 44, justifyContent: "center" },
});
