import {
    Cat,
    LayoutDashboard,
    MessageSquare,
    ScanFace,
    Settings,
    Users,
} from "lucide-react";
import { NavLink } from "react-router";

const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Users", path: "/users", icon: Users },
  { label: "Cats", path: "/cats", icon: Cat },
  { label: "Detections", path: "/detections", icon: ScanFace },
  { label: "Feedback", path: "/feedback", icon: MessageSquare },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function AdminSidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-white">
      <div className="flex h-20 items-center gap-3 border-b border-ink-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background">
          <img src="/feeline-logo.png" alt="FeELINE logo" className="h-10 w-10 rounded-xl object-contain" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-ink-900">FeELINE</h1>
          <p className="text-xs font-medium text-ink-500">Admin Panel</p>
        </div>
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-6"
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                }`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-ink-200 p-4">
        <p className="text-center text-xs text-ink-400">
          FeELINE Admin © 2026
        </p>
      </div>
    </aside>
  );
}
