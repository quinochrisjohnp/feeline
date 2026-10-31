import Analytics from "@/pages/Analytics";

import { useEffect, useState } from "react";
import {
  Cat,
  LayoutDashboard,
  MessageSquare,
  ScanFace,
  Users,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

type DashboardStats = {
  totalUsers: number;
  totalCats: number;
  totalDetections: number;
  totalFeedback: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchStats() {
      try {
        const token = sessionStorage.getItem("feeline_admin_token");

        if (!token) {
          throw new Error("Admin session not found.");
        }

        if (!API_URL) {
          throw new Error("Backend API URL is not configured.");
        }

        const response = await fetch(`${API_URL}/api/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch dashboard statistics (${response.status}).`
          );
        }

        const result = await response.json();

        if (
          result.status !== "success" ||
          !result.data
        ) {
          throw new Error("Invalid dashboard statistics response.");
        }

        if (!controller.signal.aborted) {
          setStats(result.data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard statistics."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchStats();

    return () => controller.abort();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Cats",
      value: stats?.totalCats,
      icon: Cat,
      iconBg: "bg-brand-100",
      iconColor: "text-brand-600",
    },
    {
      title: "Emotion Detections",
      value: stats?.totalDetections,
      icon: ScanFace,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Total Feedback",
      value: stats?.totalFeedback,
      icon: MessageSquare,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-ink-500">
          Welcome to the FeELINE Admin Dashboard.
        </p>
      </div>

      {/* Statistics heading */}
      <div className="flex items-center gap-2">
        <LayoutDashboard size={20} className="text-brand-600" />

        <h2 className="text-lg font-semibold text-ink-900">
          Dashboard Overview
        </h2>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-xl border border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
          Loading dashboard statistics...
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {/* Statistics cards */}
      {!loading && !error && stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-500">
                    {card.title}
                  </p>

                  <div className={`rounded-lg p-3 ${card.iconBg}`}>
                    <Icon size={22} className={card.iconColor} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold tracking-tight text-ink-900">
                  {card.value?.toLocaleString() ?? "—"}
                </p>
              </div>
            );
          })}
        </div>
      )}
      <Analytics />
    </div>
  );
}
