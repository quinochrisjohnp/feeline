import { apiFetch } from "./api";

import type {
  EmotionKey,
} from "../types/models";

export interface DetectionResponse {
  catId: string;
  imageId: string;
  imageUrl: string;
  emotion: string;
  confidence: number;
  recommendations: string[];
  detectionId: string;
}

export interface AssignDetectionResponse {
  message: string;
  catId: string;
  detectionId: string;
  imageId: string | null;
}

function getImageFileInfo(
  uri: string
): {
  name: string;
  type: string;
} {
  const cleanUri =
    uri.split("?")[0];

  const match =
    cleanUri.match(
      /\.([a-zA-Z0-9]+)$/
    );

  const extension =
    match?.[1]?.toLowerCase() ??
    "jpg";

  switch (extension) {
    case "png":
      return {
        name: "capture.png",
        type: "image/png",
      };

    case "webp":
      return {
        name: "capture.webp",
        type: "image/webp",
      };

    case "heic":
      return {
        name: "capture.heic",
        type: "image/heic",
      };

    case "heif":
      return {
        name: "capture.heif",
        type: "image/heif",
      };

    case "jpeg":
      return {
        name: "capture.jpeg",
        type: "image/jpeg",
      };

    case "jpg":
    default:
      return {
        name: "capture.jpg",
        type: "image/jpeg",
      };
  }
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data =
      await response.json();

    if (
      data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }
  } catch {
    // Ignore malformed error response.
  }

  return `Request failed (${response.status})`;
}

export function normalizeEmotion(
  emotion: string
): EmotionKey {
  switch (
    emotion.trim().toLowerCase()
  ) {
    case "happy":
      return "happy";

    case "neutral":
      return "neutral";

    case "fear":
    case "fearful":
      return "fear";

    case "angry":
      return "angry";

    default:
      throw new Error(
        `Unsupported emotion: ${emotion}`
      );
  }
}

export function normalizeConfidence(
  confidence: number
): number {
  if (
    !Number.isFinite(confidence)
  ) {
    return 0;
  }

  if (confidence <= 1) {
    return Math.round(
      confidence * 100
    );
  }

  return Math.round(
    confidence
  );
}

// ============================================================
// Called IMMEDIATELY after taking/selecting an image.
// This uploads to Cloudinary AND saves to Prisma.
// ============================================================

export async function uploadDetection(
  imageUri: string
): Promise<DetectionResponse> {
  const formData =
    new FormData();

  const fileInfo =
    getImageFileInfo(imageUri);

  formData.append(
    "image",
    {
      uri: imageUri,
      name: fileInfo.name,
      type: fileInfo.type,
    } as any
  );

  const response =
    await apiFetch(
      "/api/detection",
      {
        method: "POST",
        body: formData,
      }
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response
      )
    );
  }

  return (
    await response.json()
  ) as DetectionResponse;
}

// ============================================================
// Called AFTER user presses Save and chooses a real cat.
// Does NOT upload again.
// ============================================================

export async function assignDetectionToCat(
  detectionId: string,
  catId: string
): Promise<AssignDetectionResponse> {
  const response =
    await apiFetch(
      `/api/detection/${detectionId}/album`,
      {
        method: "PATCH",

        body: JSON.stringify({
          catId,
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response
      )
    );
  }

  return (
    await response.json()
  ) as AssignDetectionResponse;
}