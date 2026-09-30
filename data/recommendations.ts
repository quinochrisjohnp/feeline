import type { EmotionKey } from "@/types/models";

// Static per-emotion tip copy shown alongside a detection result. Not real
// AI output — just canned guidance tied to whichever mock label is shown.
export const RECOMMENDED_ACTIONS: Record<EmotionKey, string[]> = {
  angry: [
    "Avoid physical interaction for now, as your cat may react defensively.",
    "Give your cat space and allow them time to calm down.",
    "Identify and remove possible triggers such as loud noise, sudden movements, or overstimulation.",
  ],
  fear: [
    "Speak softly and avoid sudden movements near your cat.",
    "Provide a quiet, safe space where your cat can retreat.",
    "Avoid forcing interaction until your cat feels secure again.",
  ],
  neutral: [
    "Your cat seems calm. Continue regular care and observation.",
    "This is a good time for gentle play or bonding.",
  ],
  happy: [
    "Your cat appears content! Great time for play or affection.",
    "Keep up the positive environment and routine.",
  ],
};