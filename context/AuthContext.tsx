
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
  deleteAccount: () => Promise<void>;
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

  // ============================================================
  // RESTORE EXISTING FEELINE SESSION
  // ============================================================

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
      console.error(
        "Failed to restore FeELINE session:",
        err
      );

      await clearToken();
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ============================================================
  // GOOGLE SIGN-IN
  // ============================================================

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
        throw new Error(
          "Google did not return an ID token."
        );
      }

      // ============================================================
      // AUTHENTICATE WITH FEELINE BACKEND
      // ============================================================

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
      console.error(
        "Google Sign-In failed:",
        err
      );

      setError(
        "Could not sign in with Google. Please try again."
      );
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  // ============================================================
  // GOOGLE SIGN-OUT
  // ============================================================

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
      console.error(
        "FeELINE Sign-Out failed:",
        err
      );
    } finally {
      setProfile(null);
      setError(null);
    }
  }, []);

  // ============================================================
  // DELETE FEELINE ACCOUNT
  // ============================================================

  const deleteAccount = useCallback(async () => {
    if (!googleWebClientId) {
      throw new Error(
        "Google Sign-In is not configured."
      );
    }

    if (!profile) {
      throw new Error(
        "You must be signed in to delete your account."
      );
    }

    // ==========================================================
    // VERIFY GOOGLE IDENTITY
    // ==========================================================

    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    // Open the Google account selection flow.
    // Do not call the normal FeELINE login endpoint here:
    // it can create a new account.
    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) {
      throw new Error(
        "Account deletion was cancelled."
      );
    }

    if (!isSuccessResponse(response)) {
      throw new Error(
        "Google account verification failed."
      );
    }

    const idToken = response.data.idToken;

    if (!idToken) {
      throw new Error(
        "Google did not return an ID token."
      );
    }

    // ==========================================================
    // REQUEST ACCOUNT DELETION
    // ==========================================================

    const deletionResponse = await apiFetch(
      "/api/auth/account",
      {
        method: "DELETE",
        body: JSON.stringify({
          idToken,
          confirmation: "DELETE MY ACCOUNT",
        }),
      }
    );

    if (!deletionResponse.ok) {
      const result = await deletionResponse
        .json()
        .catch(() => null);

      throw new Error(
        typeof result?.error === "string"
          ? result.error
          : "Could not delete your FeELINE account."
      );
    }

    // ==========================================================
    // CLEAR LOCAL AUTHENTICATION AFTER BACKEND SUCCESS
    // ==========================================================

    // The backend has confirmed account deletion.
    // Clear the FeELINE token before ending the Google session.
    try {
      await clearToken();
    } catch (storageError) {
      console.error(
        "Failed to clear local FeELINE token:",
        storageError
      );
    }

    try {
      await GoogleSignin.signOut();
    } catch (googleError) {
      console.warn(
        "Google Sign-Out warning after deletion:",
        googleError
      );
    }

    setProfile(null);
    setError(null);

    console.log(
      "FeELINE account deletion confirmed by backend."
    );
  }, [profile]);

  // ============================================================
  // AUTH CONTEXT PROVIDER
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isSigningIn,
        error,
        signIn,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// CUSTOM AUTH HOOK
// ============================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider."
    );
  }

  return context;
}
