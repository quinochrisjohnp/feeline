import { Lightbulb } from "lucide-react";

export default function Recommendations() {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Recommendations Management
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View and manage emotion-based recommendations provided by FeELINE.
        </p>
      </div>

      {/* Placeholder content */}
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 rounded-full bg-purple-100 p-4">
          <Lightbulb size={32} className="text-purple-600" />
        </div>

        <h2 className="text-xl font-semibold text-slate-900">
          Emotion Recommendations
        </h2>

        <p className="mt-2 max-w-md text-sm text-slate-500">
          Emotion-based recommendations and their associated categories will
          appear here once the admin backend integration is complete.
        </p>
      </div>
    </div>
  );
}
