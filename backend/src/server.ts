import express from "express";
import "dotenv/config";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import detectionRoutes from "./routes/detection.routes.js";
import catsRoutes from "./routes/cats.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";

import {
  notFound,
  errorHandler,
} from "./middleware/error.middleware.js";

import {
  startAccountDeletionWorker,
} from "./services/accountDeletionWorker.service.js";

const app = express();

const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/", (_, res) => {
  res.json({
    status: "ok",
    message: "FeELINE API is running",
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/auth", authRoutes);
app.use("/api/detection", detectionRoutes);
app.use("/api/cats", catsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(notFound);
app.use(errorHandler);

// ============================================================
// SERVER STARTUP
// ============================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`FeELINE API running on port ${PORT}`);

  // Account deletion worker is disabled by default.
  // Enable only after backend integration testing.
  if (process.env.ACCOUNT_DELETION_WORKER_ENABLED === "true") {
    startAccountDeletionWorker();
  }
});
