import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn(
    "EXPO_PUBLIC_API_URL is not set. Set it in your .env file."
  );
}

const TOKEN_KEY = "feeline_auth_token";

let webToken: string | null = null;

export async function saveToken(
  token: string
): Promise<void> {
  if (Platform.OS === "web") {
    webToken = token;
    return;
  }

  await SecureStore.setItemAsync(
    TOKEN_KEY,
    token
  );
}

export async function getToken(): Promise<
  string | null
> {
  if (Platform.OS === "web") {
    return webToken;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === "web") {
    webToken = null;
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!API_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not configured."
    );
  }

  const token = await getToken();

  const headers = new Headers(
    options.headers
  );

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
}