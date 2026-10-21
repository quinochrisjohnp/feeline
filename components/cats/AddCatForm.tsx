import Button from "@/components/common/Button";
import {
  colors,
  dimensions,
  fontFamily,
  radii,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";
import { CAT_FORM_LIMITS } from "@/constants/catFormLimits";
import type { Cat, CatGender } from "@/types/models";
import { isValidBirthdate, toDateOnly } from "@/utils/date";
import { generateId } from "@/utils/id";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AddCatFormProps {
  visible: boolean;
  initialCat?: Cat | null;
  onCancel: () => void;
  onSave: (cat: Cat) => void | Promise<void>;
}

const COVER_HEIGHT = 104;
const AVATAR_SIZE = 68;

const IMAGE_ERROR =
  "We couldn't open your photos right now. Please try again.";

const PERMISSION_ERROR =
  "Photo access is turned off. You can allow it in your device Settings to choose a picture.";

function isoToDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isoToDisplay(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${month}/${day}/${year}`;
}

function defaultPickerDate(): Date {
  const now = new Date();

  return new Date(
    now.getFullYear() - 2,
    now.getMonth(),
    now.getDate()
  );
}

export default function AddCatForm({
  visible,
  initialCat,
  onCancel,
  onSave,
}: AddCatFormProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const cardWidth = Math.min(
    width * 0.92,
    width - spacing.lg * 2,
    dimensions.dialogMaxWidth
  );

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [description, setDescription] = useState("");

  const [gender, setGender] =
    useState<CatGender>("Male");

  const [birthdate, setBirthdate] = useState("");

  const [photoUri, setPhotoUri] =
    useState<string | null>(null);

  const [coverUri, setCoverUri] =
    useState<string | null>(null);

  const [nameTouched, setNameTouched] =
    useState(false);

  const [saveAttempted, setSaveAttempted] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const [imageError, setImageError] =
    useState<string | null>(null);

  const [iosPickerOpen, setIosPickerOpen] =
    useState(false);

  const [iosDraft, setIosDraft] =
    useState<Date>(defaultPickerDate());

  const submitted = useRef(false);
  const mounted = useRef(true);

  // Track whether the component is mounted.
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  // Prefill fields when editing an existing cat.
  // Clear fields when adding a new cat.
  useEffect(() => {
    if (!visible) return;

    submitted.current = false;

    setName(initialCat?.name ?? "");
    setBreed(initialCat?.breed ?? "");
    setDescription(initialCat?.description ?? "");

    setGender(initialCat?.gender ?? "Male");
    setBirthdate(initialCat?.birthdate ?? "");

    setPhotoUri(initialCat?.photoUri ?? null);
    setCoverUri(initialCat?.coverUri ?? null);

    setNameTouched(false);
    setSaveAttempted(false);
    setSaving(false);

    setSaveError(null);
    setImageError(null);
    setIosPickerOpen(false);
  }, [visible, initialCat?.id]);

  const todayIso = toDateOnly(new Date());

  const validBirthdate =
    !!birthdate &&
    isValidBirthdate(birthdate) &&
    birthdate <= todayIso;

  const nameInvalid =
    !name.trim() &&
    (nameTouched || saveAttempted);

  const birthdateInvalid =
    !validBirthdate && saveAttempted;

  const reset = () => {
    setName("");
    setBreed("");
    setDescription("");

    setGender("Male");
    setBirthdate("");

    setPhotoUri(null);
    setCoverUri(null);

    setNameTouched(false);
    setSaveAttempted(false);

    setImageError(null);
    setSaveError(null);

    setIosPickerOpen(false);
    setSaving(false);

    submitted.current = false;
  };

  const handleCancel = () => {
    if (saving) return;

    reset();
    onCancel();
  };

  // Select either a cover image or a profile image.
  const pickImage = async (
    target: "cover" | "profile"
  ) => {
    setImageError(null);

    try {
      let permission =
        await ImagePicker.getMediaLibraryPermissionsAsync();

      if (
        !permission.granted &&
        permission.canAskAgain
      ) {
        permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      // Android's system photo picker can work
      // without media-library permission.
      if (
        !permission.granted &&
        Platform.OS === "ios"
      ) {
        if (mounted.current) {
          setImageError(PERMISSION_ERROR);
        }

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect:
            target === "cover"
              ? [16, 9]
              : [1, 1],
          quality: 0.8,
          allowsMultipleSelection: false,
        });

      if (
        !mounted.current ||
        result.canceled
      ) {
        return;
      }

      const uri = result.assets?.[0]?.uri;

      if (!uri) {
        setImageError(IMAGE_ERROR);
        return;
      }

      if (target === "cover") {
        setCoverUri(uri);
      } else {
        setPhotoUri(uri);
      }
    } catch {
      if (mounted.current) {
        setImageError(IMAGE_ERROR);
      }
    }
  };

  const applyDate = (date: Date) => {
    const iso = toDateOnly(date);

    if (iso > todayIso) return;

    setBirthdate(iso);
  };

  const pickerValue = () =>
    birthdate
      ? isoToDate(birthdate)
      : defaultPickerDate();

  const openBirthdatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: pickerValue(),
        mode: "date",
        maximumDate: new Date(),

        onChange: (
          event: DateTimePickerEvent,
          date?: Date
        ) => {
          if (
            event.type === "set" &&
            date
          ) {
            applyDate(date);
          }
        },
      });
    } else {
      setIosDraft(pickerValue());
      setIosPickerOpen(true);
    }
  };

  // Save a new cat or update an existing cat.
  const handleSave = async () => {
    if (submitted.current || saving) {
      return;
    }

    setSaveAttempted(true);

    const trimmedName = name.trim();

    if (
      !trimmedName ||
      !validBirthdate
    ) {
      return;
    }

    submitted.current = true;
    setSaving(true);
    setSaveError(null);

    const catData: Cat = {
      // Keep the existing ID during editing.
      id:
        initialCat?.id ??
        generateId("cat"),

      name: trimmedName,
      breed: breed.trim() || null,
      gender,
      birthdate,
      description:
        description.trim() || null,

      photoUri,
      coverUri,
    };

    try {
      await onSave(catData);

      if (!mounted.current) {
        return;
      }

      reset();
    } catch (error) {
      console.error(
        "Save cat failed:",
        error
      );

      if (!mounted.current) {
        return;
      }

      submitted.current = false;
      setSaving(false);

      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save cat."
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        <View
          style={[
            styles.overlay,
            {
              paddingTop:
                insets.top + spacing.md,

              paddingBottom:
                insets.bottom + spacing.md,
            },
          ]}
        >
          <View
            accessibilityViewIsModal
            style={[
              styles.card,
              { width: cardWidth },
            ]}
          >
            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* COVER PHOTO */}
              <View style={styles.cover}>
                {coverUri ? (
                  <Image
                    source={{
                      uri: coverUri,
                    }}
                    style={
                      StyleSheet.absoluteFillObject
                    }
                    resizeMode="cover"
                    accessibilityLabel="Cover photo"
                  />
                ) : (
                  <View
                    style={styles.coverEmpty}
                  >
                    <Ionicons
                      name="image-outline"
                      size={34}
                      color={colors.textMuted}
                    />
                  </View>
                )}

                <Button variant="icon" label="Close cat form" onPress={handleCancel} disabled={saving}
                  style={{ position: "absolute", top: spacing.xs, left: spacing.xs, backgroundColor: colors.surface }}
                  leftIcon={<Ionicons name="close" size={22} color={colors.textPrimary} />} />
                <Pressable
                  style={styles.coverCamera}
                  hitSlop={8}
                  onPress={() =>
                    pickImage("cover")
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Change cover photo"
                >
                  <Ionicons
                    name="camera"
                    size={16}
                    color={colors.textPrimary}
                  />
                </Pressable>
              </View>

              {/* PROFILE PHOTO */}
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  {photoUri ? (
                    <Image
                      source={{
                        uri: photoUri,
                      }}
                      style={
                        StyleSheet.absoluteFillObject
                      }
                      resizeMode="cover"
                      accessibilityLabel="Profile photo"
                    />
                  ) : (
                    <Ionicons
                      name="paw"
                      size={30}
                      color={colors.textMuted}
                    />
                  )}
                </View>

                <Pressable
                  style={styles.avatarCamera}
                  hitSlop={8}
                  onPress={() =>
                    pickImage("profile")
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                >
                  <Ionicons
                    name="camera"
                    size={14}
                    color={colors.textPrimary}
                  />
                </Pressable>
              </View>

              {/* CAT INFORMATION */}
              <View style={styles.form}>
                <Text
                  style={styles.title}
                  accessibilityRole="header"
                >
                  {initialCat
                    ? "Edit Cat Profile"
                    : "New Cat Profile"}
                </Text>

                {imageError ? (
                  <Text
                    style={styles.imageError}
                    accessibilityRole="alert"
                  >
                    {imageError}
                  </Text>
                ) : null}

                {saveError ? (
                  <Text
                    style={styles.imageError}
                    accessibilityRole="alert"
                  >
                    {saveError}
                  </Text>
                ) : null}

                {/* NAME */}
                <View style={styles.row}>
                  <Text style={styles.label}>
                    Name
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "name" && styles.focused,
                      nameInvalid &&
                        styles.invalid,
                    ]}
                    value={name}
                    maxLength={CAT_FORM_LIMITS.name}
                    onChangeText={setName}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => { setNameTouched(true); setFocusedField(null); }}
                    placeholder="Name"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    accessibilityLabel="Name"
                    returnKeyType="done"
                  />
                </View>

                {nameInvalid ? (
                  <Text style={styles.error}>
                    Enter a cat name.
                  </Text>
                ) : null}

                {/* BREED */}
                <View style={styles.row}>
                  <Text style={styles.label}>
                    Breed
                  </Text>

                  <TextInput
                    style={[styles.input, focusedField === "breed" && styles.focused]}
                    onFocus={() => setFocusedField("breed")} onBlur={() => setFocusedField(null)}
                    value={breed}
                    onChangeText={setBreed}
                    placeholder="Breed (optional)"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    accessibilityLabel="Breed"
                    returnKeyType="done"
                    maxLength={CAT_FORM_LIMITS.breed}
                  />
                </View>

                {/* GENDER */}
                <View style={styles.row}>
                  <Text style={styles.label}>
                    Gender
                  </Text>

                  <View
                    style={styles.genderRow}
                    accessibilityRole="radiogroup"
                  >
                    {(
                      [
                        "Male",
                        "Female",
                      ] as CatGender[]
                    ).map((option) => (
                      <Pressable
                        key={option}
                        onPress={() =>
                          setGender(option)
                        }
                        accessibilityRole="radio"
                        accessibilityLabel={
                          option
                        }
                        accessibilityState={{
                          checked:
                            gender === option,
                        }}
                        style={[
                          styles.pill,
                          gender === option &&
                            styles.pillActive,
                        ]}
                      >
                        <Text
                          style={
                            styles.pillLabel
                          }
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* BIRTHDATE */}
                <View style={styles.row}>
                  <Text style={styles.label}>
                    Birthdate
                  </Text>

                  <Pressable
                    style={[
                      styles.input,
                      styles.dateField,
                      birthdateInvalid &&
                        styles.invalid,
                    ]}
                    onPress={
                      openBirthdatePicker
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Birthdate"
                    accessibilityValue={{
                      text: birthdate
                        ? isoToDisplay(
                            birthdate
                          )
                        : "Not selected",
                    }}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        !birthdate &&
                          styles.datePlaceholder,
                      ]}
                    >
                      {birthdate
                        ? isoToDisplay(
                            birthdate
                          )
                        : "MM/DD/YYYY"}
                    </Text>

                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={
                        colors.textSecondary
                      }
                    />
                  </Pressable>
                </View>

                {birthdateInvalid ? (
                  <Text style={styles.error}>
                    Choose a birthdate that
                    is not in the future.
                  </Text>
                ) : null}

                {/* DESCRIPTION */}
                <View
                  style={[
                    styles.row,
                    styles.descriptionRow,
                  ]}
                >
                  <Text style={styles.label}>
                    Description
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      styles.descriptionInput,
                      focusedField === "description" && styles.focused,
                    ]}
                    onFocus={() => setFocusedField("description")} onBlur={() => setFocusedField(null)}
                    value={description}
                    onChangeText={
                      setDescription
                    }
                    placeholder="About your cat (optional)"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    accessibilityLabel="Description"
                    multiline
                    textAlignVertical="top"
                    maxLength={CAT_FORM_LIMITS.description}
                  />
                </View>

                {/* IOS DATE PICKER */}
                {iosPickerOpen ? (
                  <View
                    style={styles.iosPicker}
                  >
                    <DateTimePicker
                      value={iosDraft}
                      mode="date"
                      display="spinner"
                      maximumDate={
                        new Date()
                      }
                      onChange={(
                        _event:
                          DateTimePickerEvent,
                        date?: Date
                      ) => {
                        if (date) {
                          setIosDraft(
                            date
                          );
                        }
                      }}
                    />

                    <View
                      style={
                        styles.iosActions
                      }
                    >
                      <Pressable
                        style={
                          styles.iosButton
                        }
                        onPress={() =>
                          setIosPickerOpen(
                            false
                          )
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Cancel date"
                      >
                        <Text
                          style={
                            styles.iosButtonLabel
                          }
                        >
                          Cancel
                        </Text>
                      </Pressable>

                      <Pressable
                        style={
                          styles.iosButton
                        }
                        onPress={() => {
                          applyDate(
                            iosDraft
                          );

                          setIosPickerOpen(
                            false
                          );
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Confirm date"
                      >
                        <Text
                          style={[
                            styles.iosButtonLabel,
                            styles.bold,
                          ]}
                        >
                          Done
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Button label="Cancel" variant="text" size="compact" onPress={handleCancel} disabled={saving} />
              <Button label={initialCat ? "Save changes" : "Save"} size="compact" onPress={handleSave} loading={saving} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: "hidden",
    maxHeight: "90%",
    ...shadows.floating,
  },

  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },

  cover: {
    height: COVER_HEIGHT,
    backgroundColor: colors.border,
  },

  coverEmpty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  coverCamera: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },

  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignSelf: "center",
    marginTop: -AVATAR_SIZE / 2,
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    backgroundColor: colors.placeholder,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarCamera: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },

  form: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },

  title: {
    ...typography.subheading,
    fontFamily: fontFamily.heading,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  imageError: {
    ...typography.caption,
    fontFamily: fontFamily.body,
    color: colors.dangerStrong,
    textAlign: "center",
    marginBottom: spacing.xs,
  },

  row: { gap: spacing.xs, marginBottom: spacing.sm },

  label: {
    ...typography.label,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    alignSelf: "flex-start",
  },

  input: {
    width: "100%",
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.textPrimary,
  },

  descriptionRow: {
    alignItems: "flex-start",
  },

  descriptionInput: {
    height: 92,
    borderRadius: radii.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },

  focused: { borderColor: colors.focus },
  invalid: {
    borderColor: colors.dangerStrong,
  },

  error: {
    ...typography.caption,
    fontFamily: fontFamily.body,
    color: colors.dangerStrong,
    marginLeft: 0,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },

  genderRow: {
    width: "100%",
    flexDirection: "row",
    gap: spacing.xs,
  },

  pill: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  pillLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },

  dateField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dateText: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.textPrimary,
  },

  datePlaceholder: {
    color: colors.textMuted,
  },

  iosPicker: {
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  iosActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  iosButton: {
    minHeight: dimensions.touchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },

  iosButtonLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },

  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    justifyContent: "flex-end", gap: spacing.xs, padding: spacing.sm,
  },

  bold: {
    fontFamily: fontFamily.semibold,
  },
});