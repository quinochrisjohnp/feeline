import type { DetectionRecord, EmotionKey } from "@/types/models";
import { isSameDay } from "./date";

/** Input is already cat-filtered. Count each valid detection once on its local date. */
export function dailyEmotion(records: readonly DetectionRecord[], date: Date): EmotionKey | undefined {
  const valid = records.filter(record => record.id &&
    ["angry", "fearful", "happy", "neutral"].includes(record.emotion) &&
    Number.isFinite(Date.parse(record.recordedAt)) && isSameDay(new Date(record.recordedAt), date))
    .slice().sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt) || b.id.localeCompare(a.id));
  const seen = new Set<string>();
  const counts = new Map<EmotionKey, { count: number; latest: number; id: string }>();
  for (const record of valid) {
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    const entry = counts.get(record.emotion);
    if (entry) entry.count++;
    else counts.set(record.emotion, { count: 1, latest: Date.parse(record.recordedAt), id: record.id });
  }
  return [...counts].sort((a, b) => b[1].count - a[1].count || b[1].latest - a[1].latest ||
    b[1].id.localeCompare(a[1].id))[0]?.[0];
}
