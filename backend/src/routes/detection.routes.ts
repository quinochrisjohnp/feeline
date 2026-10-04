import { Router } from "express";

import upload from "../middleware/upload.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

import {
  assignDetectionToAlbum,
  detectEmotion,
} from "../controllers/detection.controller.js";

const router = Router();

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

export default router;