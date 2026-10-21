import { useCameraTipsPreference } from "@/hooks/useCameraTipsPreference";
import { useWellnessNavigationSafety } from "@/context/WellnessContext";
import React, { useRef, useState } from "react";
import { Image, Switch, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import SettingRow from "@/components/settings/SettingRow";
import ConfirmModal from "@/components/common/ConfirmModal";
import PlaceholderBox from "@/components/common/PlaceholderBox";
import { useAuth } from "@/context/AuthContext";
import { colors, radii, spacing, typography } from "@/constants/theme";

const Settings = () => {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const tips = useCameraTipsPreference();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const logoutPending = useRef(false);
  useWellnessNavigationSafety(confirmingLogout || loggingOut);

  const handleLogout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await signOut();
      // The existing protected stack redirects to Login and removes authenticated history.
      setConfirmingLogout(false);
    } catch {
      setLogoutError("Could not log out. Please try again.");
    } finally {
      logoutPending.current = false;
      setLoggingOut(false);
    }
  };

  const displayName = profile
    ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "FeELINE User"
    : "Account unavailable";
  const displayEmail = profile?.email ?? "No email available";

  return (
    <ScreenContainer module="settings" scroll tabBar>
      <View style={styles.profileRow}>
        {profile?.profileImageUrl ? (
          <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} resizeMode="cover" accessibilityLabel="Account profile photo" />
        ) : (
          <PlaceholderBox icon="person" borderRadius={radii.pill} backgroundColor={colors.border} style={styles.avatar} />
        )}
        <View style={styles.profileText}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SettingRow icon="information-circle-outline" label="About" onPress={() => router.push("/settings-about")} />
        <SettingRow
          icon="chatbubble-ellipses-outline"
          label="Give us Feedback"
          onPress={() => router.push("/settings-feedback")}
        />
        <SettingRow
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => router.push("/settings-privacy")}
        />
        <SettingRow
          icon="document-text-outline"
          label="Terms and Conditions"
          onPress={() => router.push("/settings-terms")}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Show camera tips automatically</Text>
          <Switch accessibilityLabel="Show camera tips automatically" value={tips.enabled}
            disabled={!tips.ready || tips.saving} onValueChange={value => { void tips.setEnabled(value); }}
            trackColor={{ true: colors.primary, false: colors.border }} />
        </View>
        {tips.error ? <Text accessibilityRole="alert" style={styles.email}>{tips.error}</Text> : null}
      </View>
      <View style={styles.section}>
        <SettingRow icon="log-out-outline" label="Log out" destructive onPress={() => { setLogoutError(null); setConfirmingLogout(true); }} />
      </View>

      <ConfirmModal
        visible={confirmingLogout}
        title="Log out?"
        message={logoutError ?? "Are you sure you want to log out of FeELINE?"}
        confirmLabel="Log out"
        destructive
        busy={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => { if (!logoutPending.current) setConfirmingLogout(false); }}
      />
    </ScreenContainer>
  );
};

export default Settings;

const styles = StyleSheet.create({
  preferenceRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 44 },
  preferenceLabel: { ...typography.label, color: colors.textPrimary, flex: 1 },
  profileRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.xl },
  avatar: { width: 64, height: 64, borderRadius: 32, overflow: "hidden" },
  profileText: { marginLeft: spacing.md, flex: 1, minWidth: 0 },
  name: { ...typography.subheading, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  section: { marginBottom: spacing.lg },
});
