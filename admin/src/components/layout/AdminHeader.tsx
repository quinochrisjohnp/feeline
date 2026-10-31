
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { googleLogout } from "@react-oauth/google";
import { useNavigate } from "react-router";

export default function AdminHeader() {
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleLogout() {
    // Remove FeELINE admin JWT
    sessionStorage.removeItem("feeline_admin_token");

    // Disable Google automatic account selection where supported
    googleLogout();

    // Close dropdown and return to login
    setIsDropdownOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-20 items-center justify-between border-b border-ink-200 bg-white px-6 lg:px-8">
      {/* Left section */}
      <div>
        <h2 className="text-lg font-semibold text-ink-900">
          FeELINE Administration
        </h2>
        <p className="text-xs text-ink-500">
          Management Dashboard
        </p>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Notification icon - visual placeholder */}
        <div
          aria-label="Notifications (coming soon)"
          className="rounded-lg p-2 text-ink-500"
        >
          <Bell size={20} />
        </div>

        <div className="h-8 w-px bg-ink-200" />

        {/* Admin profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-ink-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <img src="/feeline-logo.png" alt="FeELINE logo" className="h-10 w-10 rounded-full object-contain" />
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-ink-900">
                Administrator
              </p>
              <p className="text-xs text-ink-500">
                Admin Account
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`hidden text-ink-400 transition-transform sm:block ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-ink-200 bg-white p-2 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
