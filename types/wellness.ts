export type WellnessRule = "same_day_sequence" | "consecutive_days" | "similar_time_pattern";
export interface WellnessCandidate {
  signature: string; catId: string; rule: WellnessRule; detectionIds: string[]; from: string; through: string;
}
export interface WellnessAlert extends WellnessCandidate {
  status: "pending" | "acknowledged" | "snoozed";
  createdAt: string; notificationId?: string; notified?: boolean;
}
export interface WellnessReminder {
  id: string; alertSignature: string; catId: string; scheduledAt: string;
  notificationId?: string; notificationState: "scheduled" | "off" | "failed";
  status: "scheduled" | "acknowledged"; createdAt: string; updatedAt: string;
}
export interface WellnessState { version: 1; alerts: WellnessAlert[]; reminders: WellnessReminder[]; }
export const emptyWellnessState = (): WellnessState => ({ version: 1, alerts: [], reminders: [] });
