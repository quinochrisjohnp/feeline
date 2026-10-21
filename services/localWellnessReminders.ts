import type { Cat } from "../types/models";
import { emptyWellnessState, type WellnessState, type WellnessCandidate } from "../types/wellness";
import { mergeWellnessCandidates } from "../utils/wellnessState";

export interface WellnessPorts {
  read(): Promise<WellnessState>;
  write(state: WellnessState): Promise<void>;
  permission(request: boolean): Promise<boolean>;
  notificationId(signature: string, kind: string): Promise<string>;
  schedule(input: { id: string; signature: string; catName: string; at?: string }): Promise<void>;
  cancel(id?: string): Promise<void>;
  now(): Date;
}
/** Serial local transactions prevent rapid taps/re-renders from scheduling twice. */
export class LocalWellnessReminders {
  state = emptyWellnessState();
  private tail: Promise<unknown> = Promise.resolve();
  private active = true;
  constructor(private ports: WellnessPorts, private changed: (state: WellnessState) => void) {}
  dispose() { this.active = false; }
  private run<T>(work: () => Promise<T>): Promise<T> {
    const result = this.tail.then(() => { if (!this.active) throw new Error("Wellness session closed."); return work(); });
    this.tail = result.catch(() => {});
    return result;
  }
  private async commit(next: WellnessState) {
    await this.ports.write(next);
    this.state = next;
    if (this.active) this.changed(next);
  }
  load() { return this.run(async () => { this.state = await this.ports.read(); if (this.active) this.changed(this.state); }); }
  sync(candidates: WellnessCandidate[], cats: Cat[]) {
    return this.run(async () => {
      const next = mergeWellnessCandidates(this.state, candidates, this.ports.now().toISOString());
      if (next !== this.state) await this.commit(next);
      for (const alert of this.state.alerts.filter(a => a.status === "pending" && !a.notified)) {
        const cat = cats.find(c => c.id === alert.catId);
        if (!cat || !this.active) continue;
        const allowed = await this.ports.permission(false);
        const id = await this.ports.notificationId(alert.signature, "alert");
        // Commit the delivery decision first: no repeated lock-screen alerts after restarts.
        await this.commit({ ...this.state, alerts: this.state.alerts.map(a => a.signature === alert.signature
          ? { ...a, notified: true, notificationId: allowed ? id : undefined } : a) });
        if (allowed && this.active) await this.ports.schedule({ id, signature: alert.signature, catName: cat.name });
      }
    });
  }
  saveReminder(signature: string, scheduledAt: string, catName: string) {
    return this.run(async () => {
      const now = this.ports.now();
      if (!Number.isFinite(Date.parse(scheduledAt)) || Date.parse(scheduledAt) <= now.getTime()) throw new Error("Choose a future date and time.");
      const alert = this.state.alerts.find(a => a.signature === signature);
      if (!alert) throw new Error("This check-in is no longer available.");
      const previous = this.state.reminders.find(r => r.alertSignature === signature);
      if (previous?.status === "scheduled" && previous.scheduledAt === scheduledAt && previous.notificationState !== "failed")
        return previous.notificationState === "scheduled" ? "Reminder already saved." : "Reminder saved in Calendar. Phone notifications are off.";
      await this.ports.cancel(previous?.notificationId);
      await this.ports.cancel(alert.notificationId);
      const id = await this.ports.notificationId(signature, "reminder");
      const reminder = { id, alertSignature: signature, catId: alert.catId, scheduledAt,
        notificationId: id, notificationState: "failed" as const, status: "scheduled" as const,
        createdAt: previous?.createdAt ?? now.toISOString(), updatedAt: now.toISOString() };
      // Persist the in-app reminder before requesting/scheduling any phone notification.
      await this.commit({ ...this.state,
        alerts: this.state.alerts.map(a => a.signature === signature ? { ...a, status: "snoozed" as const } : a),
        reminders: [...this.state.reminders.filter(r => r.alertSignature !== signature), reminder],
      });
      let notificationState: "scheduled" | "off" | "failed" = "failed";
      try {
        const allowed = await this.ports.permission(true);
        if (!this.active) return "Reminder saved on this device.";
        if (allowed) {
          if (Date.parse(scheduledAt) <= this.ports.now().getTime()) throw new Error("Reminder time passed during permission selection.");
          await this.ports.schedule({ id, signature, catName, at: scheduledAt });
          notificationState = "scheduled";
        } else notificationState = "off";
      } catch { /* The in-app reminder remains saved and can be edited/retried. */ }
      await this.commit({ ...this.state, reminders: this.state.reminders.map(r => r.id === id ? { ...r, notificationState } : r) });
      return notificationState === "scheduled" ? "Reminder saved. Phone delivery follows your device notification settings."
        : notificationState === "off" ? "Reminder saved in Calendar. Phone notifications are off; you can enable them in Settings."
        : "Reminder saved in Calendar, but the phone notification could not be scheduled. Edit the reminder to retry.";
    });
  }
  acknowledge(signature: string, removeReminder = false) {
    return this.run(async () => {
      const alert = this.state.alerts.find(a => a.signature === signature);
      await this.ports.cancel(alert?.notificationId);
      for (const reminder of this.state.reminders.filter(r => r.alertSignature === signature)) await this.ports.cancel(reminder.notificationId);
      await this.commit({ ...this.state,
        alerts: this.state.alerts.map(a => a.signature === signature ? { ...a, status: "acknowledged" as const } : a),
        reminders: removeReminder ? this.state.reminders.filter(r => r.alertSignature !== signature)
          : this.state.reminders.map(r => r.alertSignature === signature ? { ...r, status: "acknowledged" as const, updatedAt: this.ports.now().toISOString() } : r),
      });
    });
  }
}
