
import { Router } from "express";

import upload from "../middleware/upload.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

import {
  assignDetectionToAlbum,
  detectEmotion,
  getCalendarImages,
  getDetectionHistory,
  removeDetectionFromAlbum,
} from "../controllers/detection.controller.js";

const router = Router();

// ============================================================
// GET /api/detection
// Get all detection history (saved and unsaved images)
// ============================================================

router.get(
  "/",
  authenticate,
  getDetectionHistory
);

// ============================================================
// GET /api/detection/calendar
// Get only images saved to Unknown or Created Albums
// ============================================================

router.get(
  "/calendar",
  authenticate,
  getCalendarImages
);

// ============================================================
// POST /api/detection
// Detect cat emotion and save detection history
// ============================================================

router.post(
  "/",
  authenticate,
  upload.single("image"),
  detectEmotion
);

// ============================================================
// PATCH /api/detection/:detectionId/album
// Save image to Unknown Album or Created Album
// ============================================================

router.patch(
  "/:detectionId/album",
  authenticate,
  assignDetectionToAlbum
);

// ============================================================
// DELETE /api/detection/:detectionId/album
// Remove image from album while preserving detection history
// ============================================================

router.delete(
  "/:detectionId/album",
  authenticate,
  removeDetectionFromAlbum
);

export default router;
