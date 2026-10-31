import Pagination from "@/components/Pagination";
import { paginate } from "@/lib/pagination";

import { useEffect, useMemo, useState } from "react";
import { Eye, MessageSquare, Search, X } from "lucide-react";

type FeedbackRecord = {
  feedback_id: string;
  title: string | null;
  email: string;
  subject: string | null;
  message: string;
  created_at: string | null;
  profiles: {
    profile_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
};

// Keep aligned with the mobile feedback form's subject choices.
const SUBJECT_OPTIONS = [
  "Bug Report",
  "Feature Suggestion",
  "Emotion Detection Concern",
  "App Experience",
  "Others",
];

const API_URL = import.meta.env.VITE_API_URL;

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

export default function Feedback() {
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<FeedbackRecord | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchFeedback() {
      try {
        const token = sessionStorage.getItem("feeline_admin_token");

        if (!token) {
          throw new Error("Admin session not found.");
        }

        if (!API_URL) {
          throw new Error("Backend API URL is not configured.");
        }

        const response = await fetch(`${API_URL}/api/admin/feedback`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch feedback (${response.status}).`
          );
        }

        const result = await response.json();

        if (
          result.status !== "success" ||
          !Array.isArray(result.data)
        ) {
          throw new Error("Invalid feedback API response.");
        }

        if (!controller.signal.aborted) {
          setFeedback(result.data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load feedback records."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchFeedback();

    return () => controller.abort();
  }, []);

  const filteredFeedback = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query && !subject) return feedback;

    return feedback.filter((item) => {
      if (subject && item.subject !== subject) return false;
      if (!query) return true;
      const name = [
        item.profiles?.first_name,
        item.profiles?.last_name,
      ]
        .filter(Boolean)
        .join(" ");

      return [
        item.title,
        item.subject,
        item.email,
        item.message,
        name,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [feedback, search, subject]);

  const pagination = paginate(filteredFeedback, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">
          Feedback Management
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Review and monitor feedback submitted by FeELINE users.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-ink-200 p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare size={20} className="text-brand-600" />
              <h2 className="text-lg font-semibold text-ink-900">
                User Feedback
              </h2>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              {loading
                ? "Loading feedback..."
                : `${feedback.length} total feedback submissions`}
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-64">
              <label htmlFor="feedback-subject" className="mb-1 block text-sm font-medium text-ink-600">Subject</label>
              <select id="feedback-subject" value={subject}
                onChange={(event) => { setSubject(event.target.value); setPage(1); }}
                className="min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                <option value="">All subjects</option>
                {SUBJECT_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          <div className="relative w-full sm:w-72">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search feedback..."
              aria-label="Search feedback"
              className="w-full rounded-lg border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-ink-500">
            Loading feedback records...
          </div>
        ) : error ? (
          <div role="alert" className="p-12 text-center text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Subject</th>
                  <th className="px-6 py-4 font-semibold">Submitted</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-ink-100">
                {pagination.items.map((item) => {
                  const name =
                    [
                      item.profiles?.first_name,
                      item.profiles?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ") || "FeELINE User";

                  return (
                    <tr
                      key={item.feedback_id}
                      className="transition hover:bg-ink-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-ink-900">
                          {name}
                        </div>
                        <div className="text-xs text-ink-500">
                          {item.email}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-ink-700">
                        {item.title || "Untitled"}
                      </td>

                      <td className="px-6 py-4 text-ink-600">
                        {item.subject || "No subject"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-ink-500">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 font-medium text-brand-700 transition hover:bg-brand-100"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredFeedback.length === 0 && (
              <div className="p-12 text-center text-sm text-ink-500">
                {feedback.length === 0
                  ? "No feedback submissions yet."
                  : "No matching feedback found."}
              </div>
            )}
          </div>
        )}
        {!loading && !error && <Pagination {...pagination} onPageChange={setPage} />}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="feedback-dialog-title"
                  className="text-xl font-semibold text-ink-900"
                >
                  Feedback Details
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Submitted {formatDate(selected.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close feedback details"
                className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-ink-500">Email</p>
                <p className="mt-1 text-ink-900">
                  {selected.email}
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink-500">Title</p>
                <p className="mt-1 text-ink-900">
                  {selected.title || "Untitled"}
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink-500">Subject</p>
                <p className="mt-1 text-ink-900">
                  {selected.subject || "No subject"}
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink-500">Message</p>
                <div className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-ink-50 p-4 leading-relaxed text-ink-700">
                  {selected.message}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
