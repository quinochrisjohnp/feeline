import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  GoogleSignin,
  isCancelledResponse,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import {
  apiFetch,
  clearToken,
  getToken,
  saveToken,
} from "../services/api";

import type {
  AuthResponse,
  FeelineProfile,
} from "../types/auth";

interface AuthContextValue {
  profile: FeelineProfile | null;
  isLoading: boolean;
  isSigningIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;

// Configure native Google Sign-In using the Web OAuth Client ID.
if (googleWebClientId) {
  GoogleSignin.configure({
    webClientId: googleWebClientId,
    offlineAccess: false,
  });
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<FeelineProfile | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore an existing FeELINE session.
  const restoreSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const token = await getToken();

      if (!token) {
        setProfile(null);
        return;
      }

      const response = await apiFetch("/api/auth/me");

      if (!response.ok) {
        await clearToken();
        setProfile(null);
        return;
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      console.error("Failed to restore FeELINE session:", err);

      await clearToken();
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Sign in with Google, then exchange the Google ID token
  // for a FeELINE JWT from the backend.
  const signIn = useCallback(async () => {
    if (!googleWebClientId) {
      console.error(
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB is not configured."
      );
      setError("Google Sign-In is not configured.");
      return;
    }

    setError(null);
    setIsSigningIn(true);

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) {
        return;
      }

      if (!isSuccessResponse(response)) {
        throw new Error(
          "Google Sign-In did not complete successfully."
        );
      }

      const idToken = response.data.idToken;

      if (!idToken) {
        throw new Error("Google did not return an ID token.");
      }

      const backendResponse = await apiFetch(
        "/api/auth/google",
        {
          method: "POST",
          body: JSON.stringify({ idToken }),
        }
      );

      if (!backendResponse.ok) {
        const errorBody = await backendResponse.text();

        console.error(
          "Backend Google authentication failed:",
          backendResponse.status,
          errorBody
        );

        throw new Error(
          "Backend rejected Google authentication."
        );
      }

      const data: AuthResponse =
        await backendResponse.json();

      if (!data.token) {
        throw new Error(
          "Backend did not return a FeELINE token."
        );
      }

      await saveToken(data.token);

      setProfile(data.profile);
      setError(null);

      console.log(
        "FeELINE authentication completed successfully."
      );
    } catch (err) {
      console.error("Google Sign-In failed:", err);

      setError(
        "Could not sign in with Google. Please try again."
      );
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  // Sign out from Google and remove the local FeELINE JWT.
  const signOut = useCallback(async () => {
    try {
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        console.warn(
          "Google Sign-Out warning:",
          googleError
        );
      }

      await clearToken();
    } catch (err) {
      console.error("FeELINE Sign-Out failed:", err);
    } finally {
      setProfile(null);
      setError(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isSigningIn,
        error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider."
    );
  }

  return context;
}