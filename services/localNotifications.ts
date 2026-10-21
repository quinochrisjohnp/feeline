import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Crypto from "expo-crypto";
const channelId = "feeline-wellness";
if (Platform.OS !== "web") Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});
export const wellnessNotificationCopy = (name: string) => ({
  title: "A little check-in for " + name,
  body: "FeELINE noticed a repeated pattern. Open the app when you’re ready to check how your cat is doing.",
});
async function channel() {
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync(channelId, {
    name: "Cat wellness check-ins", importance: Notifications.AndroidImportance.DEFAULT, sound: null, enableVibrate: false,
  });
}
export async function notificationPermission(request = false): Promise<boolean> {
  if (Platform.OS === "web") return false;
  await channel();
  let permission = await Notifications.getPermissionsAsync();
  // A denied choice is respected; subsequent changes belong in device Settings.
  if (request && permission.status === "undetermined" && permission.canAskAgain)
    permission = await Notifications.requestPermissionsAsync();
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}
export async function wellnessNotificationId(owner: string, signature: string, kind: string) {
  return "wellness-" + await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, JSON.stringify([owner,signature,kind]));
}
export async function cancelWellnessNotification(id?: string) {
  if (!id || Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(id);
  await Notifications.dismissNotificationAsync(id);
}
export async function scheduleWellnessNotification(input: { id: string; owner: string; signature: string; catName: string; at?: string }) {
  if (Platform.OS === "web") return;
  await channel();
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  if (existing.some(n => n.identifier === input.id)) return;
  await Notifications.scheduleNotificationAsync({
    identifier: input.id,
    content: { ...wellnessNotificationCopy(input.catName), data: { type: "feeline-wellness", owner: input.owner, signature: input.signature } },
    trigger: input.at ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(input.at), channelId } : null,
  });
}
export function subscribeToWellnessResponses(onOpen: (owner: string, signature: string) => void) {
  if (Platform.OS === "web") return () => {};
  let live = true;
  const seen = new Set<string>();
  const handle = (response: Notifications.NotificationResponse | null) => {
    if (!live || !response) return;
    const { identifier, content } = response.notification.request;
    const data = content.data;
    const responseKey = identifier + ":" + response.notification.date;
    if (seen.has(responseKey) || data.type !== "feeline-wellness" || typeof data.owner !== "string" || typeof data.signature !== "string") return;
    seen.add(responseKey);
    onOpen(data.owner, data.signature);
    void Notifications.clearLastNotificationResponseAsync().catch(() => {});
  };
  const listener = Notifications.addNotificationResponseReceivedListener(handle);
  void Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
  return () => { live = false; listener.remove(); };
}
