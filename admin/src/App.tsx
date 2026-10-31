
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/layouts/AdminLayout";

import Login from "@/pages/Login";
import Cats from "@/pages/Cats";
import Dashboard from "@/pages/Dashboard";
import Detections from "@/pages/Detections";
import Feedback from "@/pages/Feedback";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect homepage to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public login page */}
        <Route path="/login" element={<Login />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/cats" element={<Cats />} />
            <Route path="/detections" element={<Detections />} />
            <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/recommendations" element={<Navigate to="/dashboard" replace />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Unknown pages */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
