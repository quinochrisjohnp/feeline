import express from "express";
import "dotenv/config";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import detectionRoutes from "./routes/detection.routes.js";
import catsRoutes from "./routes/cats.routes.js";

import {
  notFound,
  errorHandler,
} from "./middleware/error.middleware.js";

const app = express();

const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.json({
    status: "ok",
    message: "FeELINE API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/detection", detectionRoutes);
app.use("/api/cats", catsRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`FeELINE API running on port ${PORT}`);
});