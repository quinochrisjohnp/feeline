
import { useEffect, useState } from "react";
import {
  Activity,
  ChartNoAxesCombined,
  Percent,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type EmotionDistribution = {
  emotion: string;
  count: number;
};

type DailyTrend = {
  date: string;
  count: number;
};

type AnalyticsData = {
  totalDetections: number;
  averageConfidence: number | null;
  emotionDistribution: EmotionDistribution[];
  dailyTrends: DailyTrend[];
};

const API_URL = import.meta.env.VITE_API_URL;

const EMOTION_COLORS: Record<string, string> = {
  Angry: "#E97866",
  Neutral: "#FEDEA1",
  Fearful: "#B7A6D9",
  Happy: "#A8D8B9",
};

function formatDate(date: string) {
  // Display the exact UTC date bucket returned by the API.
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAnalytics() {
      try {
        const token = sessionStorage.getItem(
          "feeline_admin_token"
        );

        if (!token) {
          throw new Error("Admin session not found.");
        }

        if (!API_URL) {
          throw new Error("Backend API URL is not configured.");
        }

        const response = await fetch(
          `${API_URL}/api/admin/analytics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch analytics (${response.status}).`
          );
        }

        const result = await response.json();

        if (
          result.status !== "success" ||
          !result.data ||
          !Array.isArray(result.data.emotionDistribution) ||
          !Array.isArray(result.data.dailyTrends)
        ) {
          throw new Error("Invalid analytics API response.");
        }

        if (!controller.signal.aborted) {
          setAnalytics(result.data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load analytics."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchAnalytics();

    return () => controller.abort();
  }, []);

  const topEmotion = analytics?.emotionDistribution[0];

  const summaryCards = [
    {
      title: "Average Confidence",
      value:
        analytics?.averageConfidence == null
          ? "N/A"
          : `${analytics.averageConfidence.toFixed(2)}%`,
      icon: Percent,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Most Detected Emotion",
      value: topEmotion?.emotion ?? "N/A",
      icon: Activity,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-xl font-semibold text-ink-900">
          Analytics & Reports
        </h2>

        <p className="mt-2 text-sm text-ink-500">
          Analyze FeELINE system activity and emotion detection trends.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-ink-200 bg-white p-12 text-center text-sm text-ink-500">
          Loading analytics...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600"
        >
          {error}
        </div>
      ) : analytics ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {summaryCards.map((card) => {
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
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Emotion distribution */}
            <div className="min-w-0 rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2">
                <ChartNoAxesCombined
                  size={20}
                  className="text-brand-600"
                />

                <h2 className="text-lg font-semibold text-ink-900">
                  Emotion Distribution
                </h2>
              </div>

              {analytics.emotionDistribution.length === 0 ? (
                <p className="py-16 text-center text-sm text-ink-500">
                  No emotion data available.
                </p>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.emotionDistribution}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -15,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#EFE1CE"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="emotion"
                        tick={{ fontSize: 12 }}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="count"
                        name="Detections"
                        radius={[6, 6, 0, 0]}
                      >
                        {analytics.emotionDistribution.map(
                          (item) => (
                            <Cell
                              key={item.emotion}
                              fill={
                                EMOTION_COLORS[item.emotion] ??
                                "#91613D"
                              }
                            />
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Daily detection trends */}
            <div className="min-w-0 rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2">
                <Activity size={20} className="text-brand-600" />

                <h2 className="text-lg font-semibold text-ink-900">
                  Daily Detection Trends
                </h2>
              </div>

              {analytics.dailyTrends.length === 0 ? (
                <p className="py-16 text-center text-sm text-ink-500">
                  No detection trend data available.
                </p>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics.dailyTrends}
                      margin={{
                        top: 10,
                        right: 15,
                        left: -15,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#EFE1CE"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 11 }}
                        minTickGap={25}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                      />

                      <Tooltip
                        labelFormatter={(label) =>
                          String(label)
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Detections"
                        stroke="#91613D"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-ink-500">
            Analytics are calculated from recorded FeELINE emotion
            detections. Daily trends use UTC dates and show days with
            recorded activity.
          </p>
        </>
      ) : null}
    </div>
  );
}
