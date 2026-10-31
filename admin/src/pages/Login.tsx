
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin(googleToken: string) {
    setError("");
    setLoading(true);

    try {
      if (!API_URL) {
        throw new Error("Admin API URL is not configured.");
      }

      // Exchange Google ID token for FeELINE JWT
      const authResponse = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: googleToken,
        }),
      });

      if (!authResponse.ok) {
        throw new Error("Google authentication failed.");
      }

      const authData = await authResponse.json();
      const token = authData.token;

      if (typeof token !== "string" || !token) {
        throw new Error("Backend did not return a valid token.");
      }

      // Verify admin access before allowing dashboard navigation
      const adminResponse = await fetch(`${API_URL}/api/admin/test`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (adminResponse.status === 403) {
        throw new Error(
          "Access denied. This Google account is not an FeELINE administrator."
        );
      }

      if (!adminResponse.ok) {
        throw new Error("Unable to verify administrator access.");
      }

      // Store JWT for this browser tab
      sessionStorage.setItem("feeline_admin_token", token);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      sessionStorage.removeItem("feeline_admin_token");

      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 rounded-2xl bg-background p-2">
            <img src="/feeline-logo.png" alt="FeELINE logo" className="h-20 w-20 rounded-2xl object-contain" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-ink-900">
            FeELINE
          </h1>

          <p className="mt-2 text-sm font-medium text-brand-600">
            Admin Dashboard
          </p>

          <p className="mt-4 text-sm text-ink-500">
            Sign in with your authorized Google account to continue.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          {loading ? (
            <p className="text-sm text-ink-500">
              Verifying administrator access...
            </p>
          ) : (
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (!credentialResponse.credential) {
                  setError("Google did not return an ID token.");
                  return;
                }

                void handleGoogleLogin(credentialResponse.credential);
              }}
              onError={() => {
                setError("Google Sign-In failed. Please try again.");
              }}
              theme="outline"
              size="large"
              shape="pill"
              text="signin_with"
            />
          )}

          {error && (
            <div
              role="alert"
              className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600"
            >
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 border-t border-ink-100 pt-5 text-xs text-ink-400">
          <ShieldCheck size={16} />
          <span>Authorized FeELINE administrators only</span>
        </div>
      </div>
    </div>
  );
}
