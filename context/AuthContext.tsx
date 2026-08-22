import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { clearToken, getToken, saveToken } from "../services/api";
import type { FeelineProfile } from "../types/auth";

// --- Phase 1 (frontend-only) mock account -------------------------------
// TODO(auth): Replace with real Google sign-in (expo-auth-session +
// WebBrowser) once the backend + Google OAuth credentials are wired up.
// TODO(backend): Replace restoreSession's local check with a real
// GET /auth/me call once the API is connected.
const MOCK_TOKEN = "mock-session-token";
const MOCK_PROFILE: FeelineProfile = {
  profileId: "mock-profile",
  email: "demo.user@feeline.app",
  firstName: "Demo",
  lastName: "User",
  profileImageUrl: null,
};

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

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      setProfile(token === MOCK_TOKEN ? MOCK_PROFILE : null);
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
    setError(null);
    setIsSigningIn(true);

    try {
      // Simulated network delay so the loading state is visible in the UI.
      await new Promise((resolve) => setTimeout(resolve, 500));
      await saveToken(MOCK_TOKEN);
      setProfile(MOCK_PROFILE);
    } catch (err) {
      console.error("Mock sign-in failed:", err);
      setError("Could not sign in. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  }, []);

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