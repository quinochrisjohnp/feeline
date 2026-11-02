
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
  const { profile, deleteAccount } = useAuth();
  const router = useRouter();

  const [visible, setVisible] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = useRef(false);

  useWellnessNavigationSafety(visible || busy);

  const displayName = profile
    ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() ||
      "FeELINE User"
    : "Account unavailable";

  const close = () => {
    if (pending.current) return;

    setVisible(false);
    setConfirmation("");
    setError(null);
  };

  // ============================================================
  // CONFIRM ACCOUNT DELETION
  // ============================================================

  const confirm = async () => {
    if (
      confirmation !== "DELETE MY ACCOUNT" ||
      pending.current
    ) {
      return;
    }

    pending.current = true;
    setBusy(true);
    setError(null);

    try {
      await deleteAccount();

      setVisible(false);
      setConfirmation("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete your account. Please try again."
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <ScreenContainer
      module="settings"
      edges={["left", "right", "bottom"]}
      padded={false}
    >
      <DetailScreenHeader
        transparent
        title="Account Management"
        onBack={() => router.dismissTo("/settings")}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <DocumentSurface>
          <View style={styles.profileRow}>
            {profile?.profileImageUrl ? (
              <Image
                source={{ uri: profile.profileImageUrl }}
                style={styles.avatar}
                resizeMode="cover"
                accessibilityLabel="Account profile photo"
              />
            ) : (
              <PlaceholderBox
                icon="person"
                borderRadius={radii.pill}
                backgroundColor={colors.border}
                style={styles.avatar}
              />
            )}

            <View style={styles.profileText}>
              <Text style={styles.name}>
                {displayName}
              </Text>

              <Text style={styles.body} selectable>
                {profile?.email ?? "No email available"}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>
            Sign-in method
          </Text>

          <Text style={styles.body}>
            Google
          </Text>

          <Text style={[styles.label, styles.spaced]}>
            Your FeELINE account
          </Text>

          <Text style={styles.body}>
            Your cat profiles, saved images, and detection
            history are associated with your FeELINE account.
            Deleting your FeELINE account will not delete
            your Google account.
          </Text>
        </DocumentSurface>

        <View style={styles.deletion}>
          <SettingRow
            icon="trash-outline"
            label="Delete Account"
            destructive
            onPress={() => {
              setConfirmation("");
              setError(null);
              setVisible(true);
            }}
          />

          <Text style={styles.note}>
            Deleting your FeELINE account will remove your
            account and associated data. This action cannot
            be undone.
          </Text>
        </View>
      </ScrollView>

      {/* ACCOUNT DELETION CONFIRMATION MODAL */}

      <ConfirmModal
        visible={visible}
        title="Delete Account?"
        busy={busy}
        message="Are you sure you want to delete your FeELINE account? Your cat profiles, saved images, and detection history will be removed. Some image cleanup may continue after your account is deleted."
        destructive
        onCancel={close}
        onConfirm={confirm}
        actions={
          <DialogActions
            first={{
              label: "Cancel",
              variant: "outline",
              disabled: busy,
              onPress: close,
            }}
            second={{
              label: "Delete Account",
              variant: "danger",
              disabled:
                busy ||
                confirmation !== "DELETE MY ACCOUNT",
              onPress: confirm,
            }}
          />
        }
      >
        <FormField
          label="Type DELETE MY ACCOUNT to confirm"
          value={confirmation}
          onChangeText={setConfirmation}
          maxLength={17}
          autoCapitalize="characters"
          autoCorrect={false}
          disabled={busy}
          error={error ?? undefined}
        />
      </ConfirmModal>
    </ScreenContainer>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },

  profileText: {
    marginLeft: spacing.md,
    flex: 1,
    minWidth: 0,
  },

  name: {
    ...typography.subheading,
    color: colors.textPrimary,
  },

  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  body: {
    ...typography.body,
    color: colors.textSecondary,
  },

  spaced: {
    marginTop: spacing.lg,
  },

  deletion: {
    marginTop: spacing.xl,
  },

  note: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
