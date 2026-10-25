
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  ShieldCheck,
  CalendarDays,
  Users,
  Shield,
  ScrollText,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface AdminProfile {
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_image_url: string | null;
  role: string;
  created_at: string | null;
}

export default function Settings() {
  const [profile, setProfile] = useState<AdminProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAdminProfile() {
      try {
        const token = sessionStorage.getItem(
          "feeline_admin_token"
        );

        if (!token) {
          throw new Error("Admin session not found.");
        }

        if (!API_URL) {
          throw new Error("Admin API URL is not configured.");
        }

        const response = await fetch(
          `${API_URL}/api/admin/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load admin profile.");
        }

        const result = await response.json();

        if (!controller.signal.aborted) {
          setProfile(result.data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load admin profile."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchAdminProfile();

    return () => controller.abort();
  }, []);

  const fullName = profile
    ? [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(" ") || "Administrator"
    : "";

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(
        "en-PH",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : "Not available";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your FeELINE administrator account and
          system preferences.
        </p>
      </div>

      {/* Admin Profile */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
            <UserRound size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Admin Profile
            </h2>
            <p className="text-sm text-slate-500">
              Your administrator account information
            </p>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-slate-500">
            Loading administrator profile...
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        {!loading && !error && profile && (
          <>
            <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt="Admin profile"
                  className="h-16 w-16 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <UserRound size={30} />
                </div>
              )}

              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {fullName}
                </h3>
                <p className="text-sm text-slate-500">
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <UserRound
                  size={19}
                  className="mt-1 text-purple-600"
                />
                <div>
                  <p className="text-xs text-slate-500">
                    Full Name
                  </p>
                  <p className="font-medium text-slate-900">
                    {fullName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail
                  size={19}
                  className="mt-1 text-purple-600"
                />
                <div>
                  <p className="text-xs text-slate-500">
                    Email Address
                  </p>
                  <p className="font-medium text-slate-900">
                    {profile.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-1 text-purple-600"
                />
                <div>
                  <p className="text-xs text-slate-500">
                    Account Role
                  </p>
                  <p className="font-medium capitalize text-slate-900">
                    {profile.role}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays
                  size={19}
                  className="mt-1 text-purple-600"
                />
                <div>
                  <p className="text-xs text-slate-500">
                    Account Created
                  </p>
                  <p className="font-medium text-slate-900">
                    {joinedDate}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Upcoming Settings Sections */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Admin Management",
            description:
              "Manage authorized FeELINE administrators.",
            icon: Users,
          },
          {
            title: "Roles & Permissions",
            description:
              "Configure administrator access levels.",
            icon: Shield,
          },
          {
            title: "Activity Logs",
            description:
              "Review important administrator actions.",
            icon: ScrollText,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3 text-purple-600">
                <Icon size={22} />
              </div>

              <h3 className="font-semibold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {item.description}
              </p>

              <p className="mt-4 text-xs font-medium text-slate-400">
                Coming soon
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
