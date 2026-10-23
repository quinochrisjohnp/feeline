import sharp from "sharp";

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

export class InvalidImageError extends Error {
  constructor(public readonly statusCode: 400 | 415 = 400) { super("Invalid or unsupported image"); }
}

export async function predictCatEmotion(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<PredictionOutcome> {
  // UPDATED: Normalize the image for Railway AI.
  // JPEG and PNG are preserved; other formats are converted.
  const imageMetadata = await sharp(imageBuffer).metadata().catch(() => { throw new InvalidImageError(); });

  let aiImageBuffer = imageBuffer;
  let aiMimeType = mimeType;
  let aiFilename = "cat.jpg";

  if (imageMetadata.format === "jpeg") {
    aiMimeType = "image/jpeg";
    aiFilename = "cat.jpg";
  } else if (imageMetadata.format === "png") {
    aiMimeType = "image/png";
    aiFilename = "cat.png";
  } else {
    // Convert WebP, HEIC, HEIF, and other supported
    // formats into actual JPEG bytes.
    aiImageBuffer = await sharp(imageBuffer)
      .rotate()
      .jpeg({ quality: 90 })
      .toBuffer().catch(() => { throw new InvalidImageError(); });

    aiMimeType = "image/jpeg";
    aiFilename = "cat.jpg";
  }

  const formData = new FormData();

  formData.append(
    "file",
    new Blob([new Uint8Array(aiImageBuffer)], {
      type: aiMimeType,
    }),
    aiFilename,
  );

  const aiUrl = process.env.AI_SERVICE_URL?.replace(/\/+$/, "");

  if (!aiUrl) {
    throw new Error("AI_SERVICE_URL is not configured.");
  }

  const response = await fetch(`${aiUrl}/predict`, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(180000),
  });

  if (response.status === 400 || response.status === 415) throw new InvalidImageError(response.status);
  if (!response.ok) throw new Error("AI service unavailable");
  return parsePredictionOutcome(await response.json());
}
