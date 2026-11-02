import { useWellnessNavigationSafety } from "@/context/WellnessContext";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import SettingRow from "@/components/settings/SettingRow";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing, typography } from "@/constants/theme";

const Settings = () => {
  const { signOut } = useAuth();
  const router = useRouter();
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

  return (
    <ScreenContainer module="settings" scroll tabBar>
      <Text style={styles.title} accessibilityRole="header">Settings</Text>

      <View style={styles.section}>
        <SettingRow
          icon="person-circle-outline"
          label="Account Management"
          onPress={() => router.push("/settings-account")}
        />
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
  title: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.xl },
  section: { marginBottom: spacing.lg },
});
