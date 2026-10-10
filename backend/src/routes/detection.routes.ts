import { Router } from "express";

import upload from "../middleware/upload.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

import {
  assignDetectionToAlbum,
  detectEmotion,
  getDetectionHistory,
  removeDetectionFromAlbum,
} from "../controllers/detection.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  getDetectionHistory
);

router.post(
  "/",
  authenticate,
  upload.single("image"),
  detectEmotion
);

router.patch(
  "/:detectionId/album",
  authenticate,
  assignDetectionToAlbum
);

// Remove an image from its Album without deleting
// its detection record or Cloudinary image.
router.delete(
  "/:detectionId/album",
  authenticate,
  removeDetectionFromAlbum
);

export default router;