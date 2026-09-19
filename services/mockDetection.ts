import type { EmotionKey } from "../types/models";

export type MockDetection =
  | { outcome: "normal" | "low"; emotion: EmotionKey; confidence: number }
  | { outcome: "error"; message: string };

/** Fixed demonstration samples. No image analysis, network, or random outcomes. */
export const MOCK_SAMPLES = [
  { id: "angry", label: "Angry cues", result: { outcome: "normal", emotion: "angry", confidence: 90 } },
  { id: "happy", label: "Happy cues", result: { outcome: "normal", emotion: "happy", confidence: 94 } },
  { id: "neutral", label: "Neutral cues", result: { outcome: "normal", emotion: "neutral", confidence: 85 } },
  { id: "fear", label: "Fearful cues", result: { outcome: "normal", emotion: "fear", confidence: 88 } },
  { id: "low", label: "Unclear cues", result: { outcome: "low", emotion: "angry", confidence: 20 } },
  { id: "no-cat", label: "Not a cat", result: { outcome: "error", message: "No cat could be identified in this mock image." } },
  { id: "blurry", label: "Blurry image", result: { outcome: "error", message: "This mock image appears too blurry. Try a clearer photo." } },
  { id: "dark", label: "Dark image", result: { outcome: "error", message: "This mock image appears too dark. Try a well-lit photo." } },
  { id: "cropped", label: "Cropped image", result: { outcome: "error", message: "Please try a clearer photo with the full cat visible." } },
  { id: "error", label: "Detection error", result: { outcome: "error", message: "Please try again." } },
] as const satisfies readonly { id: string; label: string; result: MockDetection }[];

export type MockSampleId = typeof MOCK_SAMPLES[number]["id"];
export interface MockCapture {
  sampleId: MockSampleId;
  imageUri: string;
  capturedAt: string;
}

export const mockImageUri = (sampleId: MockSampleId) => `mock:camera/${sampleId}`;

export function createMockCapture(sampleId: MockSampleId, capturedAt: string): MockCapture {
  return { sampleId, imageUri: mockImageUri(sampleId), capturedAt };
}

export function detectMockCapture(capture: MockCapture): MockDetection {
  return { ...MOCK_SAMPLES.find((sample) => sample.id === capture.sampleId)!.result };
}

/** Reject incomplete, repeated, or forged route values instead of silently saving defaults. */
export function parseMockCapture(params: Record<string, string | string[] | undefined>): MockCapture | null {
  const sample = MOCK_SAMPLES.find((item) => item.id === params.sampleId);
  const { imageUri, capturedAt } = params;
  if (!sample || imageUri !== mockImageUri(sample.id) || typeof capturedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(capturedAt) ||
      !Number.isFinite(Date.parse(capturedAt)) || new Date(capturedAt).toISOString() !== capturedAt) return null;
  return { sampleId: sample.id, imageUri, capturedAt };
}
