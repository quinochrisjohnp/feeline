import type { CatDataState, DetectionRecord } from "../types/models";
import type { WellnessCandidate, WellnessRule } from "../types/wellness";
export const localDayKey = (date: Date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("-");
const dayNumber = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
const minutes = (date: Date) => date.getHours() * 60 + date.getMinutes();
const relevant = (r: DetectionRecord) => r.emotion === "angry" || r.emotion === "fear";
export function validDetectionTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  if (!Number.isFinite(Date.parse(value))) return false;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function candidate(catId: string, rule: WellnessRule, rows: DetectionRecord[]): WellnessCandidate {
  const sorted = [...rows].sort((a,b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt) || a.id.localeCompare(b.id));
  const detectionIds = sorted.map(r => r.id);
  const from = sorted[0].recordedAt, through = sorted[sorted.length - 1].recordedAt;
  return { catId, rule, detectionIds, from, through, signature: JSON.stringify([catId, rule, detectionIds, from, through]) };
}
/** App check-in heuristics, not diagnostic thresholds. No prediction or source records are changed.
 * Latest qualifying pattern per cat; similar-time context wins when patterns end together. */
export function detectWellnessPatterns(state: CatDataState): WellnessCandidate[] {
  const seen = new Set<string>(), groups = new Map<string, DetectionRecord[]>();
  const identified = new Set(state.cats.filter(c => c.id !== "unknown-cats" && c.name.trim().toLowerCase() !== "unknown cats").map(c => c.id));
  const records = [...state.detectionRecords].sort((a,b) => a.id.localeCompare(b.id) || a.recordedAt.localeCompare(b.recordedAt));
  for (const record of records) {
    if (!record.id || !validDetectionTime(record.recordedAt) || seen.has(record.id)) continue;
    seen.add(record.id);
    const image = state.images.find(i => i.id === record.imageId);
    const catId = record.catId !== undefined ? record.catId : state.albums.find(a => a.id === image?.albumId && a.kind === "cat")?.catId;
    if (!catId || !identified.has(catId)) continue;
    const rows = groups.get(catId) ?? []; rows.push(record); groups.set(catId, rows);
  }
  const results: WellnessCandidate[] = [];
  for (const [catId, rows] of groups) {
    rows.sort((a,b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt) || a.id.localeCompare(b.id));
    const matches: WellnessCandidate[] = [];
    for (let i = 2; i < rows.length; i++) {
      const three = rows.slice(i - 2, i + 1);
      if (three.every(relevant) && Date.parse(three[2].recordedAt) - Date.parse(three[0].recordedAt) <= 86400000)
        matches.push(candidate(catId, "same_day_sequence", three));
    }
    const negative = rows.filter(relevant), days = new Map<number, DetectionRecord>();
    for (const row of negative) days.set(dayNumber(new Date(row.recordedAt)), row);
    for (const [day, row] of days) {
      const first = days.get(day - 2), second = days.get(day - 1);
      if (first && second) matches.push(candidate(catId, "consecutive_days", [first, second, row]));
    }
    // Circular local-clock window also handles patterns around midnight.
    for (const anchor of negative) {
      const start = minutes(new Date(anchor.recordedAt));
      const within = negative.filter(r => (minutes(new Date(r.recordedAt)) - start + 1440) % 1440 <= 120);
      const separateDays = new Map<string, DetectionRecord>();
      for (const row of within) separateDays.set(localDayKey(new Date(row.recordedAt)), row);
      const latest = [...separateDays.values()].sort((a,b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt)).slice(-3);
      if (latest.length === 3) matches.push(candidate(catId, "similar_time_pattern", latest));
    }
    const priority: Record<WellnessRule, number> = { similar_time_pattern: 3, consecutive_days: 2, same_day_sequence: 1 };
    matches.sort((a,b) => Date.parse(b.through) - Date.parse(a.through) || priority[b.rule] - priority[a.rule] || a.signature.localeCompare(b.signature));
    if (matches[0]) results.push(matches[0]);
  }
  return results.sort((a,b) => a.catId.localeCompare(b.catId));
}
