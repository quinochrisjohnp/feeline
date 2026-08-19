import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./database";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "FeELINE Backend API is running.",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "healthy",
  });
});

app.get("/health/database", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      status: "Database connection successful",
      database_time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      status: "Database connection failed",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`FeELINE Backend running on port ${PORT}`);
});