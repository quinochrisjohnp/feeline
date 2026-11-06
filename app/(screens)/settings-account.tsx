import React, { useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import DocumentSurface from "@/components/common/DocumentSurface";
import PlaceholderBox from "@/components/common/PlaceholderBox";
import ConfirmModal from "@/components/common/ConfirmModal";
import DialogActions from "@/components/common/DialogActions";
import FormField from "@/components/common/FormField";
import SettingRow from "@/components/settings/SettingRow";
import { useAuth } from "@/context/AuthContext";
import { useWellnessNavigationSafety } from "@/context/WellnessContext";
import { colors, radii, spacing, typography } from "@/constants/theme";

export default function AccountManagement() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  useWellnessNavigationSafety(visible || busy);
  const displayName = profile
    ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "FeELINE User"
    : "Account unavailable";
  const close = () => {
    if (pending.current) return;
    setVisible(false);
    setConfirmation("");
    setError(null);
  };
  const confirm = async () => {
    if (confirmation !== "DELETE ACCOUNT" || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      // UI preview only: no account, image, or record deletion request is made.
      await signOut();
      setVisible(false);
      setConfirmation("");
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <ScreenContainer module="settings" edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader transparent title="Account Management" onBack={() => router.dismissTo("/settings")} />
      <ScrollView contentContainerStyle={styles.content}>
        <DocumentSurface>
          <View style={styles.profileRow}>
            {profile?.profileImageUrl ? (
              <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} resizeMode="cover" accessibilityLabel="Account profile photo" />
            ) : (
              <PlaceholderBox icon="person" borderRadius={radii.pill} backgroundColor={colors.border} style={styles.avatar} />
            )}
            <View style={styles.profileText}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.body} selectable>{profile?.email ?? "No email available"}</Text>
            </View>
          </View>
          <Text style={styles.label}>Sign-in method</Text>
          <Text style={styles.body}>Google</Text>
          <Text style={[styles.label, styles.spaced]}>Your FeELINE account</Text>
          <Text style={styles.body}>Your cat profiles, saved images, and detection history are associated with this account. Signing out does not delete this data or your Google account.</Text>
        </DocumentSurface>
        <View style={styles.deletion}>
          <SettingRow icon="trash-outline" label="Delete Account" destructive onPress={() => { setConfirmation(""); setError(null); setVisible(true); }} />
          <Text style={styles.note}>UI preview only. Account deletion is not available yet; confirming below only signs you out. Your account and saved data will remain.</Text>
        </View>
      </ScrollView>
      <ConfirmModal visible={visible} title="Delete Account?" busy={busy}
        message="Once implemented, this action will delete your FeELINE account and its saved images, cat profiles, and detection history. For now, this is a UI preview: confirming only signs you out and does not delete any data."
        destructive onCancel={close} onConfirm={confirm}
        actions={<DialogActions first={{ label: "Cancel", variant: "outline", disabled: busy, onPress: close }}
          second={{ label: "Confirm sign out", variant: "danger", disabled: busy || confirmation !== "DELETE ACCOUNT", onPress: confirm }} />}>
        <FormField label="Type DELETE ACCOUNT to confirm" value={confirmation} onChangeText={setConfirmation}
          maxLength={14} autoCapitalize="characters" autoCorrect={false} disabled={busy} error={error ?? undefined} />
      </ConfirmModal>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, flexGrow: 1 },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, overflow: "hidden" },
  profileText: { marginLeft: spacing.md, flex: 1, minWidth: 0 },
  name: { ...typography.subheading, color: colors.textPrimary },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.textSecondary },
  spaced: { marginTop: spacing.lg },
  deletion: { marginTop: spacing.xl },
  note: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
});
