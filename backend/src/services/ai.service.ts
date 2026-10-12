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

  if (!response.ok) {
    throw new Error(`AI service error: ${response.status}`);
  }

  const data = (await response.json()) as AIPredictionResponse;

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
