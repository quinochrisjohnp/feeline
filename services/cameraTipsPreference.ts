import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
const KEY = "feeline.cameraTips.automatic";
let snapshot = { enabled: true, ready: false, saving: false, error: null as string | null };
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;
const emit = () => listeners.forEach(fn => fn());
export const getCameraTipsPreference = () => snapshot;
export const subscribeCameraTipsPreference = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function loadCameraTipsPreference() {
  if (!loading) loading = (async () => {
    try {
      const value = Platform.OS === "web" ? globalThis.localStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
      snapshot = { ...snapshot, enabled: value !== "false", ready: true };
    } catch { snapshot = { ...snapshot, ready: true, error: "Camera tips preference could not be loaded." }; }
    emit();
  })();
  return loading;
}
export async function setCameraTipsPreference(enabled: boolean) {
  await loadCameraTipsPreference();
  if (snapshot.saving) return;
  snapshot = { ...snapshot, saving: true, error: null }; emit();
  try {
    if (Platform.OS === "web") globalThis.localStorage.setItem(KEY, String(enabled));
    else await SecureStore.setItemAsync(KEY, String(enabled));
    snapshot = { ...snapshot, enabled, saving: false };
  } catch { snapshot = { ...snapshot, saving: false, error: "Preference could not be saved. Please try again." }; }
  emit();
}
