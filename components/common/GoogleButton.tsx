import React from "react";
import { AntDesign } from "@expo/vector-icons";
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
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      leftIcon={<AntDesign name="google" size={18} color="#EA4335" />}
    />
  );
}