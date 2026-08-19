import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`FeELINE Backend running on port ${PORT}`);
});