import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { usePathname } from "expo-router";
import GlobalWellnessHost from "@/components/wellness/GlobalWellnessHost";
import { usePresentationBlocked } from "./PresentationContext";
import { useAuth } from "./AuthContext";
import { useCatData } from "./CatDataContext";
import { emptyWellnessState, type WellnessState } from "@/types/wellness";
import { detectWellnessPatterns } from "@/utils/detectWellnessPatterns";
import { LocalWellnessReminders } from "@/services/localWellnessReminders";
import { createWellnessStorage, wellnessAccountKey } from "@/services/wellnessStorage";
import { cancelWellnessNotification, notificationPermission, scheduleWellnessNotification,
  subscribeToWellnessResponses, wellnessNotificationId } from "@/services/localNotifications";

interface WellnessContextValue {
  canPresent: boolean;
  state: WellnessState; ready: boolean; error: string | null; now: number;
  foregroundSession: number; requestedSignature: string | null;
  setCameraSafe(safe: boolean): void;
  setScreenSafe(path: string, safe: boolean): void;
  consumeRequest(): void;
  hasPresented(signature: string): boolean;
  markPresented(signature: string): void;
  claimPresentation(signature: string): Promise<boolean>;
  acknowledge(signature: string, remove?: boolean): Promise<void>;
  saveReminder(signature: string, at: string, name: string): Promise<string>;
}
const unavailable: WellnessContextValue = {
  canPresent: false, state: emptyWellnessState(), ready: false, error: null, now: 0, foregroundSession: 0, requestedSignature: null,
  setCameraSafe() {}, setScreenSafe() {}, consumeRequest() {}, hasPresented: () => false, markPresented() {},
  claimPresentation: async () => false,
  acknowledge: async () => { throw new Error("Sign in to manage check-ins."); },
  saveReminder: async () => { throw new Error("Sign in to manage reminders."); },
};
const WellnessContext = createContext<WellnessContextValue>(unavailable);
export const useWellness = () => useContext(WellnessContext);

export function WellnessProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  // Support the current API's id and the existing frontend profileId type without changing auth.
  const owner = profile ? (profile as typeof profile & { id?: string }).id ?? profile.profileId ?? profile.email : null;
  return owner ? <AccountWellness key={owner} owner={owner}>{children}</AccountWellness>
    : <WellnessContext.Provider value={unavailable}>{children}</WellnessContext.Provider>;
}
function AccountWellness({ owner, children }: { owner: string; children: React.ReactNode }) {
  const { state: data, catsLoading, detectionsLoading, catsError, detectionsError } = useCatData();
  const [state, setState] = useState(emptyWellnessState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const [foregroundSession, setForegroundSession] = useState(0);
  const [requests, setRequests] = useState<string[]>([]);
  const requestedSignature = requests[0] ?? null;
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const [safePath, setSafePath] = useState<string | null>(null);
  const setScreenSafe = useCallback((path: string, safe: boolean) => {
    setSafePath(current => safe ? path : current === path ? null : current);
  }, []);
  const setCameraSafe = useCallback((safe: boolean) => setScreenSafe("/camera", safe), [setScreenSafe]);
  const repo = useRef<LocalWellnessReminders | null>(null);
  const pathname = usePathname();
  const modalBlocked = usePresentationBlocked();
  const canPresent = ready && !catsLoading && !detectionsLoading && !catsError && !detectionsError && appActive && safePath === pathname && !modalBlocked;
  const presented = useRef(new Set<string>());
  const hasPresented = useCallback((signature: string) => {
    const alert = state.alerts.find(a => a.signature === signature);
    const reminder = state.reminders.find(r => r.alertSignature === signature);
    return alert?.status === "acknowledged" || (alert?.status === "snoozed"
      ? !!reminder && reminder.presentedOccurrence === reminder.id + ":" + reminder.scheduledAt
      : !!alert?.presentedAt) || presented.current.has(signature);
  }, [state]);
  const claimPresentation = useCallback(async (signature: string) => {
    if (!repo.current) return false;
    return repo.current.claimPresentation(signature);
  }, []);
  const markPresented = useCallback((signature: string) => { presented.current.add(signature); }, []);
  useEffect(() => {
    let live = true;
    let service: LocalWellnessReminders | null = null;
    let unsubscribe = () => {};
    void (async () => {
      const key = await wellnessAccountKey(owner);
      if (!live) return;
      service = new LocalWellnessReminders({
        ...createWellnessStorage(key),
        permission: notificationPermission, cancel: cancelWellnessNotification, now: () => new Date(),
        notificationId: (signature, kind) => wellnessNotificationId(key, signature, kind),
        schedule: input => scheduleWellnessNotification({ ...input, owner: key }),
      }, value => { if (live) setState(value); });
      repo.current = service;
      await service.load();
      if (!live) return;
      unsubscribe = subscribeToWellnessResponses((account, signature) => {
        if (account === key) setRequests(current => current.includes(signature) ? current : [...current, signature]);
      });
      setReady(true);
    })().catch(() => { if (live) setError("Local check-ins could not be loaded. Reopen the app to retry."); });
    return () => { live = false; service?.dispose(); unsubscribe(); repo.current = null; };
  }, [owner]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", next => {
      setAppActive(next === "active");
      if (next === "active") { setNow(Date.now()); setForegroundSession(s => s + 1); }
    });
    // Refresh due reminders throughout the authenticated app.
    const timer = setInterval(() => { if (AppState.currentState === "active") setNow(Date.now()); }, 15000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!ready || catsLoading || detectionsLoading || catsError || detectionsError) return;
    let live = true;
    void repo.current?.sync(detectWellnessPatterns(data), data.cats).catch(() => {
      if (live) setError("A local check-in or phone notification could not be saved. Your detection history is unchanged.");
    });
    return () => { live = false; };
  }, [ready, data, catsLoading, detectionsLoading, catsError, detectionsError]);
  const consumeRequest = useCallback(() => setRequests(current => current.slice(1)), []);
  const acknowledge = useCallback(async (signature: string, remove = false) => {
    if (!repo.current || !ready) throw new Error("Local check-ins are still loading.");
    await repo.current.acknowledge(signature, remove);
  }, [ready]);
  const saveReminder = useCallback(async (signature: string, at: string, name: string) => {
    if (!repo.current || !ready) throw new Error("Local reminders are still loading.");
    const message = await repo.current.saveReminder(signature, at, name);
    presented.current.delete(signature);
    return message;
  }, [ready]);
  return <WellnessContext.Provider value={{ canPresent, state, ready, error, now, foregroundSession, requestedSignature,
    setCameraSafe, setScreenSafe, consumeRequest, hasPresented, markPresented, claimPresentation, acknowledge, saveReminder }}>{children}<GlobalWellnessHost /></WellnessContext.Provider>;
}

/** Tabs register only when no form, permission prompt, or critical modal is active. */
export function useWellnessNavigationSafety(blocked: boolean) {
  const { setScreenSafe } = useWellness();
  const path = usePathname(), focused = useIsFocused();
  useEffect(() => {
    if (!focused) return;
    setScreenSafe(path, !blocked);
    return () => setScreenSafe(path, false);
  }, [path, focused, blocked, setScreenSafe]);
}
