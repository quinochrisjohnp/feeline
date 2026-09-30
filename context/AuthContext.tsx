import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { apiFetch, clearToken, getToken, saveToken } from "../services/api";
import type { AuthResponse, FeelineProfile } from "../types/auth";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  profile: FeelineProfile | null;
  isLoading: boolean;
  isSigningIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<FeelineProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configure Google Auth for Implicit Flow
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  });

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();

      if (!token) {
        setProfile(null);
        return;
      }

      const res = await apiFetch("/auth/me");

      if (!res.ok) {
        await clearToken();
        setProfile(null);
        return;
      }

      const data = await res.json();
      setProfile(data.profile);
    } catch (err) {
      console.error("Failed to restore session:", err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(async () => {
    if (!request) {
      setError("Google sign-in is not ready yet. Try again in a moment.");
      return;
    }

    setError(null);
    setIsSigningIn(true);

    try {
      const res = await promptAsync();

      if (res.type !== "success") {
        setIsSigningIn(false);
        return;
      }

      // Grab ID Token directly from the implicit flow authentication object
      const idToken = res.authentication?.idToken || res.params?.id_token;

      if (!idToken) {
        throw new Error("Google did not return an ID token.");
      }

      const backendRes = await apiFetch("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });

      if (!backendRes.ok) {
        throw new Error("Backend rejected the Google sign-in.");
      }

      const data: AuthResponse = await backendRes.json();

      await saveToken(data.token);
      setProfile(data.profile);
    } catch (err) {
      console.error("Sign-in failed:", err);
      setError("Could not sign in with Google. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  }, [request, promptAsync]);

  const signOut = useCallback(async () => {
    await clearToken();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ profile, isLoading, isSigningIn, error, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}