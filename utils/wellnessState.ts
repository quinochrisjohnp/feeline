import type { WellnessCandidate, WellnessState } from "../types/wellness";
import { localDayKey } from "./detectWellnessPatterns";
export function mergeWellnessCandidates(state: WellnessState, candidates: WellnessCandidate[], now: string): WellnessState {
  const added = candidates.filter(candidate => {
    const existing = state.alerts.filter(a => a.catId === candidate.catId);
    return !existing.some(a => a.signature === candidate.signature || a.status !== "acknowledged" || Date.parse(a.through) >= Date.parse(candidate.through));
  }).map(c => ({ ...c, status: "pending" as const, createdAt: now }));
  return added.length ? { ...state, alerts: [...state.alerts, ...added] } : state;
}
export function dueWellnessAlerts(state: WellnessState, now: number) {
  return state.alerts.filter(a => a.status === "pending" || (a.status === "snoozed" && state.reminders.some(r =>
    r.alertSignature === a.signature && r.status === "scheduled" && Date.parse(r.scheduledAt) <= now)));
}
export function remindersForDate(state: WellnessState, date: Date, catId: string | null) {
  return state.reminders.filter(r => (!catId || r.catId === catId) && localDayKey(new Date(r.scheduledAt)) === localDayKey(date))
    .sort((a,b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
}
