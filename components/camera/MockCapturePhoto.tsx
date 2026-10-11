import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";

import { getBundledCatImage } from "@/data/bundledCatImages";
import { isDeviceImageUri } from "@/utils/mediaUri";

import {
  colors,
  radii,
  typography,
} from "@/constants/theme";

function isRemoteImageUri(
  uri: string
): boolean {
  return (
    uri.startsWith("https://") ||
    uri.startsWith("http://")
  );
}

/**
 * Displays:
 * - bundled/mock cat images
 * - local device images
 * - remote images such as Cloudinary URLs
 *
 * Expo Image handles image orientation/decoding.
 */
export default function MockCapturePhoto({
  imageUri,
  imageWidth,
  imageHeight,
  label = "Captured or selected cat image",
}: {
  imageUri: string;
  imageWidth?: number;
  imageHeight?: number;
  label?: string;
}) {
  const [
    loadedSize,
    setLoadedSize,
  ] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);

  const [
    failedUri,
    setFailedUri,
  ] = useState<string | null>(
    null
  );

  const bundledSource =
    getBundledCatImage(imageUri);

  const source =
    bundledSource ??
    (isDeviceImageUri(imageUri) ||
    isRemoteImageUri(imageUri)
      ? {
          uri: imageUri,
        }
      : undefined);

  const size =
    loadedSize?.uri === imageUri
      ? loadedSize
      : {
          width: imageWidth,
          height: imageHeight,
        };

  const aspectRatio =
    size.width &&
    size.height &&
    size.width > 0 &&
    size.height > 0
      ? size.width / size.height
      : undefined;

  if (
    !source ||
    failedUri === imageUri
  ) {
    return (
      <Text style={styles.message}>
        This image is no longer
        available. Please capture or
        choose it again.
      </Text>
    );
  }

  return (
    <View
      style={[
        styles.photo,
        {
          aspectRatio:
            aspectRatio ?? 1,
        },
      ]}
    >
      <Image
        key={imageUri}
        source={source}
        contentFit="contain"
        style={StyleSheet.absoluteFill}
        accessible
        accessibilityLabel={label}
        testID={imageUri}
        onLoad={({
          source: decoded,
        }) => {
          if (
            decoded.width > 0 &&
            decoded.height > 0
          ) {
            setLoadedSize({
              uri: imageUri,
              width: decoded.width,
              height: decoded.height,
            });
          }
        }}
        onError={() => {
          setFailedUri(imageUri);
        }}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    photo: {
      width: "100%",
      alignSelf: "center",
      overflow: "hidden",
      borderRadius: radii.lg,
    },

    message: {
      ...typography.caption,
      color:
        colors.textSecondary,
      textAlign: "center",
    },
  });