import Pagination from "@/components/Pagination";
import { paginate } from "@/lib/pagination";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

type UserProfile = {
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_image_url: string | null;
  role: string;
  created_at: string | null;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchUsers() {
      try {
        const token = sessionStorage.getItem("feeline_admin_token");

        if (!token) {
          throw new Error("Admin session not found.");
        }

        if (!API_URL) {
          throw new Error("Backend API URL is not configured.");
        }

        const response = await fetch(`${API_URL}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch users (${response.status}).`);
        }

        const result = await response.json();

        if (result.status !== "success" || !Array.isArray(result.data)) {
          throw new Error("Invalid users API response.");
        }

        if (!controller.signal.aborted) {
          setUsers(result.data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load registered users."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchUsers();

    return () => controller.abort();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
      const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`;

      return (
        fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

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

  const pagination = paginate(filteredUsers, page);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">
          User Management
        </h1>

        <p className="mt-2 text-sm text-ink-500">
          View registered FeELINE users and account information.
        </p>
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-ink-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UsersRound size={20} className="text-brand-600" />

              <h2 className="text-lg font-semibold text-ink-900">
                Registered Users
              </h2>
            </div>

            <p className="mt-1 text-sm text-ink-500">
              {loading
                ? "Loading users..."
                : `${users.length} total registered accounts`}
            </p>
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
              placeholder="Search users..."
              aria-label="Search users"
              className="w-full rounded-lg border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-ink-500">
            Loading registered users...
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
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Date Joined</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-ink-100">
                {pagination.items.map((user) => {
                  const fullName =
                    [user.first_name, user.last_name]
                      .filter(Boolean)
                      .join(" ") || "Unnamed User";

                  return (
                    <tr
                      key={user.profile_id}
                      className="transition hover:bg-ink-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.profile_image_url ? (
                            <img
                              src={user.profile_image_url}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600">
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <span className="font-medium text-ink-900">
                            {fullName}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-ink-600">
                        {user.email}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-brand-100 text-brand-700"
                              : "bg-ink-100 text-ink-600"
                          }`}
                        >
                          {user.role === "admin" && (
                            <ShieldCheck size={13} />
                          )}

                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-ink-500">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center text-sm text-ink-500">
                No users found.
              </div>
            )}
          </div>
        )}
        {!loading && !error && <Pagination {...pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
}
