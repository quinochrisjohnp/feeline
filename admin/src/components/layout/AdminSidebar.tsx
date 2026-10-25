import {
    Cat,
    ChartNoAxesCombined,
    LayoutDashboard,
    Lightbulb,
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
  { label: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
  { label: "Feedback", path: "/feedback", icon: MessageSquare },
  {
    label: "Recommendations",
    path: "/recommendations",
    icon: Lightbulb,
  },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function AdminSidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white">
          <Cat size={24} />
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-900">FeELINE</h1>
          <p className="text-xs font-medium text-slate-500">Admin Panel</p>
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
                    ? "bg-purple-50 text-purple-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="text-center text-xs text-slate-400">
          FeELINE Admin © 2026
        </p>
      </div>
    </aside>
  );
}
