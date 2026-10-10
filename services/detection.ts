
import { apiFetch } from "./api";

import type {
  DetectionRecord,
  EmotionKey,
  SavedImage,
} from "../types/models";

import { UNKNOWN_ALBUM_ID } from "../types/models";

// ============================================================
// TYPES
// ============================================================

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

interface BackendHistoryItem {
  detectionId: string;
  imageId: string;
  imageUrl: string;

  catId: string;
  isUnknown: boolean;
  isSavedToAlbum: boolean;

  emotion: string;
  confidence: number;

  capturedAt: string;
  detectedAt: string;
}

interface DetectionHistoryResponse {
  detections: BackendHistoryItem[];
}

export interface DetectionHistory {
  images: SavedImage[];
  detectionRecords: DetectionRecord[];
}

// ============================================================
// IMAGE FILE INFORMATION
// ============================================================

function getImageFileInfo(
  uri: string
): {
  name: string;
  type: string;
} {
  const cleanUri = uri.split("?")[0];

  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);

  const extension = match?.[1]?.toLowerCase() ?? "jpg";

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

// ============================================================
// API ERROR HANDLING
// ============================================================

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data = await response.json();

    if (data && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // Ignore malformed error response.
  }

  return `Request failed (${response.status})`;
}

// ============================================================
// NORMALIZE EMOTION
// ============================================================

export function normalizeEmotion(
  emotion: string
): EmotionKey {
  switch (emotion.trim().toLowerCase()) {
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

// ============================================================
// NORMALIZE CONFIDENCE
// ============================================================

export function normalizeConfidence(
  confidence: number
): number {
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  const normalized =
    confidence <= 1
      ? confidence * 100
      : confidence;

  return Math.max(
    0,
    Math.min(100, Math.round(normalized))
  );
}

// ============================================================
// GET PERSISTED DETECTION HISTORY
//
// All detections remain in Detection History.
//
// Only images explicitly saved to an album
// are included in the images array.
// ============================================================

export async function fetchDetectionHistory(): Promise<DetectionHistory> {
  const response = await apiFetch(
    "/api/detection"
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const data =
    (await response.json()) as DetectionHistoryResponse;

  const images: SavedImage[] = [];

  const detectionRecords: DetectionRecord[] = [];

  for (const item of data.detections) {
    let emotion: EmotionKey;

    try {
      emotion = normalizeEmotion(
        item.emotion
      );
    } catch {
      console.warn(
        "Skipping unsupported detection emotion:",
        item.emotion
      );

      continue;
    }

    const albumId = item.isUnknown
      ? UNKNOWN_ALBUM_ID
      : `album-${item.catId}`;

    // Only explicitly saved images appear in Albums.
    if (item.isSavedToAlbum === true) {
      images.push({
        id: item.imageId,
        albumId,
        imageUri: item.imageUrl,
        capturedAt: item.capturedAt,
      });
    }

    // Keep every detection in Detection History,
    // including detections not saved to an Album.
    detectionRecords.push({
      id: item.detectionId,
      imageId: item.imageId,
      emotion,
      confidence: normalizeConfidence(
        item.confidence
      ),
      recordedAt: item.detectedAt,

      // Original Cloudinary image URL.
      imageUri: item.imageUrl,

      // Whether the user manually saved this image to an Album.
      isSavedToAlbum: item.isSavedToAlbum === true,

      // Associated cat, or null for Unknown Cats.
      catId: item.isUnknown ? null : item.catId,
    });
  }

  return {
    images,
    detectionRecords,
  };
}

// ============================================================
// UPLOAD DETECTION
//
// Called immediately after capturing/uploading an image.
//
// Uploads the image to Cloudinary.
// Persists the image and detection in PostgreSQL.
//
// The backend creates the image with:
// is_saved_to_album = false
//
// This function does NOT save the image to an Album.
// ============================================================

export async function uploadDetection(
  imageUri: string
): Promise<DetectionResponse> {
  const formData = new FormData();

  const fileInfo = getImageFileInfo(
    imageUri
  );

  formData.append(
    "image",
    {
      uri: imageUri,
      name: fileInfo.name,
      type: fileInfo.type,
    } as any
  );

  const response = await apiFetch(
    "/api/detection",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  return (
    await response.json()
  ) as DetectionResponse;
}

// ============================================================
// SAVE DETECTION TO PERSONAL CAT ALBUM
//
// Moves an existing detection/image to a real cat.
//
// Backend sets:
// is_saved_to_album = true
//
// Does NOT upload to Cloudinary again.
// ============================================================

export async function assignDetectionToCat(
  detectionId: string,
  catId: string
): Promise<AssignDetectionResponse> {
  const response = await apiFetch(
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
      await getErrorMessage(response)
    );
  }

  return (
    await response.json()
  ) as AssignDetectionResponse;
}

// ============================================================
// SAVE DETECTION TO UNKNOWN ALBUM
//
// Marks the existing image as explicitly saved.
//
// Backend sets:
// is_saved_to_album = true
//
// Does NOT create another detection.
// Does NOT upload to Cloudinary again.
// ============================================================

export async function saveDetectionToUnknown(
  detectionId: string
): Promise<AssignDetectionResponse> {
  const response = await apiFetch(
    `/api/detection/${detectionId}/album`,
    {
      method: "PATCH",
      body: JSON.stringify({
        saveToUnknown: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  return (
    await response.json()
  ) as AssignDetectionResponse;
}

// Remove a detection image from its Album.
// The detection history and Cloudinary image remain intact.
export async function removeDetectionFromAlbum(
  detectionId: string
): Promise<void> {
  await apiFetch(
    `/api/detection/${encodeURIComponent(detectionId)}/album`,
    {
      method: "DELETE",
    }
  );
}