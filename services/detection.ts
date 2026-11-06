
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

export interface AcceptedDetectionResponse extends PredictionOutcome {
  status: "success";
  catId: string;
  imageId: string;
  imageUrl: string;
  emotion: string;
  confidence: number;
  recommendations: string[];
  detectionId: string;
}

export type PredictionStatus = "success" | "low_confidence" | "rejected_non_cat" | "rejected_multiple_cats" | "cannot_predict";
export interface PredictionOutcome {
  status: PredictionStatus;
  validation: { accepted_as_domestic_cat: boolean; cat_probability: number; threshold: number };
  cat_count: number;
  rejection: { reason: string | null; message: string | null };
  prediction: { emotion: "angry" | "fearful" | "happy" | "neutral" | null; confidence: number | null;
    probabilities: Record<string, number | null>; route: string };
}

/** Validate untrusted JSON and reconstruct only public fields. Never persist malformed output. */
export function parsePredictionOutcome(value: unknown): PredictionOutcome {
  const object = (v: unknown): Record<string, unknown> => {
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Invalid prediction response");
    return v as Record<string, unknown>;
  };
  const unit = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
  const d = object(value), v = object(d.validation), p = object(d.prediction), r = object(d.rejection);
  const emotions = ["angry", "fearful", "happy", "neutral"];
  const statuses = ["success", "low_confidence", "rejected_non_cat", "rejected_multiple_cats", "cannot_predict"];
  const count = d.cat_count;
  if (!statuses.includes(String(d.status)) || typeof count !== "number" || !Number.isSafeInteger(count) || count < 0 ||
      typeof v.accepted_as_domestic_cat !== "boolean" || !unit(v.cat_probability) || v.threshold !== 0.56 ||
      !(r.reason === null || typeof r.reason === "string") || !(r.message === null || typeof r.message === "string")) throw new Error("Invalid prediction response");
  const predicted = d.status === "success" || d.status === "low_confidence";
  if (v.accepted_as_domestic_cat !== (v.cat_probability >= v.threshold) ||
      (d.status === "rejected_non_cat" ? count !== 0 || v.accepted_as_domestic_cat : !v.accepted_as_domestic_cat) ||
      (d.status === "rejected_multiple_cats" && count < 2) || (d.status === "cannot_predict" && count > 1) ||
      (predicted && count !== 1)) throw new Error("Invalid prediction count or validation");
  const probabilities = object(p.probabilities);
  if (Object.keys(probabilities).length !== 4 || !emotions.every(e => e in probabilities)) throw new Error("Invalid probabilities");
  if (predicted) {
    if (typeof p.emotion !== "string" || !emotions.includes(p.emotion) || !unit(p.confidence) ||
        !emotions.every(e => unit(probabilities[e])) || r.reason !== null || r.message !== null ||
        !["gated_fusion", "face_only_fallback"].includes(String(p.route))) throw new Error("Invalid prediction");
    const values = emotions.map(e => probabilities[e] as number);
    if (Math.abs(values.reduce((a,b) => a+b,0) - 1) > 0.0001 ||
        Math.abs((probabilities[p.emotion] as number) - p.confidence) > 0.0001 ||
        p.confidence + 0.0001 < Math.max(...values)) throw new Error("Invalid probability distribution");
  } else if (p.emotion !== null || p.confidence !== null || !emotions.every(e => probabilities[e] === null) ||
      !["cat_validation", "multiple_cat_rejection", "detection_failure"].includes(String(p.route))) throw new Error("Rejected prediction must be empty");
  const reasons: Record<string, [string, string]> = {
    rejected_non_cat: ["non_cat", "No real domestic cat was detected."],
    rejected_multiple_cats: ["multiple_cats_detected", count + " cats were detected. FeELINE can analyze only one cat at a time."],
    cannot_predict: ["unclear_cat", "A usable cat face could not be analyzed."],
  };
  const reason = reasons[d.status as string];
  if (reason && r.reason !== reason[0]) throw new Error("Invalid rejection reason");
  return {
    status: d.status as PredictionStatus, cat_count: count,
    validation: { accepted_as_domestic_cat: v.accepted_as_domestic_cat, cat_probability: v.cat_probability, threshold: v.threshold },
    rejection: { reason: reason?.[0] ?? null, message: reason?.[1] ?? null },
    prediction: { emotion: p.emotion as PredictionOutcome["prediction"]["emotion"], confidence: p.confidence as number | null,
      probabilities: Object.fromEntries(emotions.map(e => [e, probabilities[e] as number | null])), route: p.route as string },
  };
}

export type DetectionResponse = AcceptedDetectionResponse | (PredictionOutcome & { status: Exclude<PredictionStatus, "success"> });

export function parseDetectionResponse(value: unknown): DetectionResponse {
  const outcome = parsePredictionOutcome(value);
  if (outcome.status !== "success") return outcome as DetectionResponse;
  const d = value as Record<string, unknown>;
  const uuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  if (![d.catId, d.imageId, d.detectionId].every(uuid) || typeof d.imageUrl !== "string" || !/^https?:\/\/[^\s]+$/.test(d.imageUrl) ||
      !Array.isArray(d.recommendations) || !d.recommendations.every(r => typeof r === "string")) throw new Error("Invalid stored detection");
  return { ...outcome, status: "success", catId: d.catId as string, imageId: d.imageId as string,
    detectionId: d.detectionId as string, imageUrl: d.imageUrl, recommendations: d.recommendations as string[],
    emotion: outcome.prediction.emotion!, confidence: outcome.prediction.confidence! };
}

/** The result and save routes accept only the same fully validated success envelope. */
export function parseDetectionRoute(value: unknown): AcceptedDetectionResponse | null {
  if (typeof value !== "string") return null;
  try { const result = parseDetectionResponse(JSON.parse(value)); return result.status === "success" ? result : null; }
  catch { return null; }
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

  recommendations?: string[];
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

      confidence: normalizeConfidence(item.confidence),

      recommendations: Array.isArray(item.recommendations)
        ? item.recommendations.filter(
            (recommendation): recommendation is string =>
              typeof recommendation === "string" &&
              recommendation.trim().length > 0
          )
        : [],

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

  const data: unknown = await response.json();
  // Keep invalid-count rejections out of result/save, but preserve their known
  // semantic status for the count-free modal. All other malformed data fails closed.
  if (data && typeof data === "object" && !Array.isArray(data) &&
      "status" in data && data.status === "rejected_multiple_cats") {
    const count = "cat_count" in data ? data.cat_count : undefined;
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 2) {
      throw Object.assign(new Error("Multiple-cat rejection without a valid count"), {
        status: "rejected_multiple_cats",
      });
    }
  }
  return parseDetectionResponse(data);
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