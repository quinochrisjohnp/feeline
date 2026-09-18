import React from "react";
import { AntDesign } from "@expo/vector-icons";
import { colors, dimensions } from "@/constants/theme";
import Button from "./Button";

interface GoogleButtonProps {
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

export default function GoogleButton({
  onPress,
  loading,
  disabled,
  label = "Continue with Google",
}: GoogleButtonProps) {
  return (
    <Button
      label={label}
      variant="google"
      fullWidth
      style={{ width: "100%", maxWidth: dimensions.googleMaxWidth, alignSelf: "center" }}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      leftIcon={<AntDesign name="google" size={dimensions.iconSmall} color={colors.googleMark} />}
    />
  );
}