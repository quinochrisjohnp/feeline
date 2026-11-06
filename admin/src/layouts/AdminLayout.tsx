import AdminHeader from "@/components/layout/AdminHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Outlet } from "react-router";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Right section */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <AdminHeader />

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
