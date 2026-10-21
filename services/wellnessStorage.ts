import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { emptyWellnessState, type WellnessState } from "../types/wellness";

/** Separate namespace from auth. Chunked, revision-based commits keep each SecureStore value small. */
export async function wellnessAccountKey(owner: string) {
  return "feeline.wellness." + await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, owner);
}
const storage = {
  get: async (key: string) => Platform.OS === "web" ? globalThis.localStorage.getItem(key) : SecureStore.getItemAsync(key),
  set: async (key: string, value: string) => { if (Platform.OS === "web") globalThis.localStorage.setItem(key, value); else await SecureStore.setItemAsync(key, value); },
  remove: async (key: string) => { if (Platform.OS === "web") globalThis.localStorage.removeItem(key); else await SecureStore.deleteItemAsync(key); },
};
export function createWellnessStorage(prefix: string, adapter = storage) {
  const manifestKey = prefix + ".manifest";
  return {
    async read(): Promise<WellnessState> {
      const raw = await adapter.get(manifestKey);
      if (!raw) return emptyWellnessState();
      const manifest = JSON.parse(raw);
      if (typeof manifest.revision !== "string" || !Number.isInteger(manifest.count) || manifest.count < 1 || manifest.count > 10000)
        throw new Error("Wellness storage could not be read.");
      const parts = await Promise.all(Array.from({ length: manifest.count }, (_,i) => adapter.get(prefix + "." + manifest.revision + "." + i)));
      if (parts.some(p => p === null)) throw new Error("Wellness storage is incomplete.");
      const data = JSON.parse(parts.join(""));
      if (data.version !== 1 || !Array.isArray(data.alerts) || !Array.isArray(data.reminders)
        || !data.alerts.every((a: Record<string, unknown>) => typeof a.signature === "string" && typeof a.catId === "string" && Array.isArray(a.detectionIds)
          && ["pending","acknowledged","snoozed"].includes(String(a.status)))
        || !data.reminders.every((r: Record<string, unknown>) => typeof r.id === "string" && typeof r.alertSignature === "string"
          && typeof r.scheduledAt === "string" && Number.isFinite(Date.parse(r.scheduledAt))))
        throw new Error("Wellness storage format is invalid.");
      return data;
    },
    async write(data: WellnessState) {
      const old = await adapter.get(manifestKey);
      const revision = Crypto.randomUUID();
      // Split by Unicode code point: <=1600 UTF-8 bytes, without splitting surrogate pairs.
      const characters = Array.from(JSON.stringify(data));
      const parts = Array.from({ length: Math.ceil(characters.length / 400) }, (_,i) => characters.slice(i*400,(i+1)*400).join(""));
      for (let i=0;i<parts.length;i++) await adapter.set(prefix + "." + revision + "." + i, parts[i]);
      await adapter.set(manifestKey, JSON.stringify({ revision, count: parts.length }));
      if (old) {
        const previous = JSON.parse(old);
        await Promise.all(Array.from({ length: previous.count }, (_,i) => adapter.remove(prefix + "." + previous.revision + "." + i).catch(() => {})));
      }
    },
  };
}
