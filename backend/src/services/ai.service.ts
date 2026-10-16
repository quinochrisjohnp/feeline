
type AIPredictionResponse = {
  status: string;
  prediction: {
    emotion: string | null;
    confidence: number | null;
    probabilities: Record<string, number | null>;
    route: string;
  };
  warnings: string[];
};

// ADDED: Dedicated error for rejected cat images.
export class CatValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatValidationError";
  }
}

export async function predictCatEmotion(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<{
  emotion: string;
  confidence: number;
}> {
  const formData = new FormData();

  formData.append(
    "file",
    new Blob([new Uint8Array(imageBuffer)], {
      type: mimeType,
    }),
    "cat.jpg",
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

  // ADDED: Handle image rejection from Railway AI.
  if (response.status === 422) {
    let message =
      "No usable cat face detected. Please upload a clear image of a cat.";

    try {
      const errorData = (await response.json()) as {
        detail?: string;
      };

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep the default message if parsing fails.
    }

    throw new CatValidationError(message);
  }

  // PRESERVED: Other AI service errors.
  if (!response.ok) {
    throw new Error(`AI service error: ${response.status}`);
  }

  const data = (await response.json()) as AIPredictionResponse;

  // ADDED: Handle a non-predictable image even if
  // Railway returns HTTP 200.
  if (data.status === "cannot_predict") {
    throw new CatValidationError(
      "No usable cat face detected. Please upload a clear image of a cat.",
    );
  }

  // PRESERVED: Existing prediction validation.
  if (
    data.status !== "success" ||
    !data.prediction.emotion ||
    data.prediction.confidence === null ||
    !Number.isFinite(data.prediction.confidence) ||
    data.prediction.confidence < 0 ||
    data.prediction.confidence > 1
  ) {
    throw new Error(
      `AI could not produce a reliable prediction: ${data.status}`,
    );
  }

  return {
    emotion:
      data.prediction.emotion.charAt(0).toUpperCase() +
      data.prediction.emotion.slice(1).toLowerCase(),
    confidence: data.prediction.confidence,
  };
}
