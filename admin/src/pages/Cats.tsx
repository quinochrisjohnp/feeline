
import { useEffect, useMemo, useState } from "react";
import { Cat, Search } from "lucide-react";

type CatRecord = {
  cat_id: string;
  name: string;
  breed: string | null;
  sex: string | null;
  age: number | null;
  profile_image_url: string | null;
  created_at: string | null;
  profiles: {
    profile_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
};

const API_URL = import.meta.env.VITE_API_URL;

export default function Cats() {
  const [cats, setCats] = useState<CatRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchCats() {
      try {
        const token = sessionStorage.getItem("feeline_admin_token");

        if (!token) {
          throw new Error("Admin session not found.");
        }

        if (!API_URL) {
          throw new Error("Backend API URL is not configured.");
        }

        const response = await fetch(`${API_URL}/api/admin/cats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch cats (${response.status}).`);
        }

        const result = await response.json();

        if (result.status !== "success" || !Array.isArray(result.data)) {
          throw new Error("Invalid cats API response.");
        }

        if (!controller.signal.aborted) {
          setCats(result.data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load registered cats."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchCats();

    return () => controller.abort();
  }, []);

  const filteredCats = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return cats;

    return cats.filter((cat) => {
      const ownerName = [
        cat.profiles?.first_name,
        cat.profiles?.last_name,
      ]
        .filter(Boolean)
        .join(" ");

      return (
        cat.name.toLowerCase().includes(query) ||
        (cat.breed ?? "").toLowerCase().includes(query) ||
        (cat.sex ?? "").toLowerCase().includes(query) ||
        ownerName.toLowerCase().includes(query) ||
        (cat.profiles?.email ?? "").toLowerCase().includes(query)
      );
    });
  }, [cats, search]);

  function formatDate(date: string | null) {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "N/A";

    return parsed.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Cat Management
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View registered cats and their owners in FeELINE.
        </p>
      </div>

      {/* Cats table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Cat size={20} className="text-purple-600" />

              <h2 className="text-lg font-semibold text-slate-900">
                Registered Cats
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading cats..."
                : `${cats.length} total registered cats`}
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
              placeholder="Search cats or owners..."
              aria-label="Search cats or owners"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading registered cats...
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
                  <th className="px-6 py-4 font-semibold">Breed</th>
                  <th className="px-6 py-4 font-semibold">Sex</th>
                  <th className="px-6 py-4 font-semibold">Age</th>
                  <th className="px-6 py-4 font-semibold">Owner</th>
                  <th className="px-6 py-4 font-semibold">Date Added</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCats.map((cat) => {
                  const ownerName =
                    [
                      cat.profiles?.first_name,
                      cat.profiles?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ") || "Unknown Owner";

                  return (
                    <tr
                      key={cat.cat_id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {cat.profile_image_url ? (
                            <img
                              src={cat.profile_image_url}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                              <Cat size={20} />
                            </div>
                          )}

                          <span className="font-medium text-slate-900">
                            {cat.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {cat.breed || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {cat.sex || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {cat.age ?? "N/A"}
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {ownerName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {cat.profiles?.email ?? "N/A"}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(cat.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredCats.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-500">
                No cats found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
