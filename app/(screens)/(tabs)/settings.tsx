import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import SettingRow from "@/components/settings/SettingRow";
import ConfirmModal from "@/components/common/ConfirmModal";
import PlaceholderBox from "@/components/common/PlaceholderBox";
import { useAuth } from "@/context/AuthContext";
import { colors, radii, spacing, typography } from "@/constants/theme";

const settings = () => {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const displayName = profile
    ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "FeELINE User"
    : "Guest User";
  const displayEmail = profile?.email ?? "guest@example.com";

  return (
    <ScreenContainer scroll contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}>
      <View style={styles.profileRow}>
        {profile?.profileImageUrl ? (
          <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} />
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
        <SettingRow icon="log-out-outline" label="Log out" destructive onPress={() => setConfirmingLogout(true)} />
      </View>

      <ConfirmModal
        visible={confirmingLogout}
        title="Log out?"
        message="Are you sure you want to log out of FeELINE?"
        confirmLabel="Log out"
        destructive
        onConfirm={() => {
          setConfirmingLogout(false);
          signOut();
        }}
        onCancel={() => setConfirmingLogout(false)}
      />
    </ScreenContainer>
  );
};

export default settings;

const styles = StyleSheet.create({
  profileRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.xl },
  avatar: { width: 72, height: 72 },
  profileText: { marginLeft: spacing.md, flex: 1 },
  name: { ...typography.subheading, color: colors.textPrimary },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  section: { marginBottom: spacing.lg },
});