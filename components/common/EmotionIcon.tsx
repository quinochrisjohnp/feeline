import React from "react";
import { Image, type ImageSourcePropType, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, dimensions } from "@/constants/theme";
import { EMOTIONS, type EmotionKey } from "@/types/models";
import { normalizeEmotionKey } from "@/utils/emotion";

const EMOTION_IMAGES: Record<EmotionKey, ImageSourcePropType> = {
  happy: require("../images/emotion_happy.png"),
  angry: require("../images/emotion_angry.png"),
  fear: require("../images/emotion_fearful.png"),
  neutral: require("../images/emotion_neutral.png"),
};

interface EmotionIconProps {
  emotion?: string | null;
  size?: number;
}

export default function EmotionIcon({ emotion, size = dimensions.emotionBadge }: EmotionIconProps) {
  const key = normalizeEmotionKey(emotion);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={key ? EMOTIONS[key].label : "Emotion unavailable"}
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, padding: size * 0.1 }]}>
      {key ? (
        <Image source={EMOTION_IMAGES[key]} style={styles.image} resizeMode="contain" accessible={false} />
      ) : (
        <Ionicons name="help-outline" size={size * 0.5} color={colors.textSecondary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Inset protects the artwork's corner accent marks from circular clipping.
  circle: { overflow: "hidden", flexShrink: 0, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
});
