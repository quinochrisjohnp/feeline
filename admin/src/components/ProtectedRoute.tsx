
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const API_URL = import.meta.env.VITE_API_URL;

export default function ProtectedRoute() {
  const [status, setStatus] = useState<
    "checking" | "authorized" | "unauthorized"
  >("checking");

  useEffect(() => {
    const controller = new AbortController();

    async function verifyAdmin() {
      const token = sessionStorage.getItem("feeline_admin_token");

      if (!token || !API_URL) {
        setStatus("unauthorized");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/admin/test`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (response.ok) {
          setStatus("authorized");
        } else {
          sessionStorage.removeItem("feeline_admin_token");
          setStatus("unauthorized");
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatus("unauthorized");
        }
      }
    }

    void verifyAdmin();

    return () => controller.abort();
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <p className="text-sm text-ink-500">
          Verifying administrator access...
        </p>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
