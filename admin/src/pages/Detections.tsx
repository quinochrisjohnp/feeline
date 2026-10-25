
import { useEffect, useMemo, useState } from "react";
import { ScanFace, Search } from "lucide-react";

type DetectionRecord = {
  detection_id: string;
  confidence_score: string | number | null;
  detected_at: string | null;
  cats: {
    cat_id: string;
    name: string;
    profiles: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  };
  emotion_categories: {
    emotion_name: string;
  };
};

const API_URL = import.meta.env.VITE_API_URL;

export default function Detections() {
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDetections() {
      try {
        const token = sessionStorage.getItem("feeline_admin_token");

        if (!token) {
          throw new Error("Admin session not found.");
        }

        if (!API_URL) {
          throw new Error("Backend API URL is not configured.");
        }

        const response = await fetch(
          `${API_URL}/api/admin/detections`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch detections (${response.status}).`
          );
        }

        const result = await response.json();

        if (
          result.status !== "success" ||
          !Array.isArray(result.data)
        ) {
          throw new Error("Invalid detections API response.");
        }

        if (!controller.signal.aborted) {
          setDetections(result.data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load emotion detections."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchDetections();

    return () => controller.abort();
  }, []);

  const filteredDetections = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return detections;

    return detections.filter((detection) => {
      const ownerName = [
        detection.cats?.profiles?.first_name,
        detection.cats?.profiles?.last_name,
      ]
        .filter(Boolean)
        .join(" ");

      return (
        (detection.cats?.name ?? "").toLowerCase().includes(query) ||
        (detection.emotion_categories?.emotion_name ?? "")
          .toLowerCase()
          .includes(query) ||
        ownerName.toLowerCase().includes(query) ||
        (detection.cats?.profiles?.email ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [detections, search]);

  function formatConfidence(value: string | number | null) {
    if (value == null) return "N/A";

    const confidence = Number(value);

    if (!Number.isFinite(confidence)) return "N/A";

    return `${(confidence * 100).toFixed(2)}%`;
  }

  function formatDate(date: string | null) {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "N/A";

    return parsed.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Emotion Detections
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Monitor cat emotion detection records in FeELINE.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ScanFace size={20} className="text-purple-600" />

              <h2 className="text-lg font-semibold text-slate-900">
                Detection Records
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading detections..."
                : `${detections.length} total emotion detections`}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search detections..."
              aria-label="Search detections"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading emotion detections...
          </div>
        ) : error ? (
          <div role="alert" className="p-12 text-center text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Cat</th>
                  <th className="px-6 py-4 font-semibold">Emotion</th>
                  <th className="px-6 py-4 font-semibold">Confidence</th>
                  <th className="px-6 py-4 font-semibold">Owner</th>
                  <th className="px-6 py-4 font-semibold">Detected At</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredDetections.map((detection) => {
                  const ownerName =
                    [
                      detection.cats?.profiles?.first_name,
                      detection.cats?.profiles?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ") || "Unknown Owner";

                  return (
                    <tr
                      key={detection.detection_id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {detection.cats?.name ?? "N/A"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                          {detection.emotion_categories?.emotion_name ??
                            "N/A"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {formatConfidence(detection.confidence_score)}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {ownerName}
                        </p>

                        <p className="text-xs text-slate-500">
                          {detection.cats?.profiles?.email ?? "N/A"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(detection.detected_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredDetections.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-500">
                No detections found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
