/** Remote photo display only; camera capture validation remains device-local. */
export function isRemoteImageUri(value: unknown): value is string {
  if (typeof value !== "string" || /\s|[\u0000-\u001f\u007f]|%(?![\da-f]{2})/i.test(value)) return false;
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    return !!new URL(value).hostname;
  } catch {
    return false;
  }
}

/** Device-local media and Expo web image payloads only; never remote image URLs. */
export function isDeviceImageUri(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value)) return false;
  if (/^data:image\/(?:jpeg|png|webp|gif|heic|heif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true;
  if (/\s|%(?![\da-f]{2})/i.test(value)) return false;
  return /^file:\/\/\/[^?#]+/.test(value) ||
    /^(?:content|ph|assets-library):\/\/[^/]+(?:\/[^\s]*)?$/.test(value) ||
    /^blob:(?:https?:\/\/[^/]+|null)\/[^/]+$/.test(value);
}
