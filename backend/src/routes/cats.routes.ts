import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
  createCat,
  deleteCat,
  getCatDetections,
  getMyCats,
  updateCat,
} from "../controllers/cats.controller.js";

const router = Router();

router.post(
  '/',
  authenticate,
  upload.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 },
  ]),
  createCat
);

router.get("/", authenticate, getMyCats);

router.put(
  "/:catId",
  authenticate,
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "cover_image", maxCount: 1 },
  ]),
  updateCat,
);

router.delete("/:catId", authenticate, deleteCat);

router.get("/:catId/detections", authenticate, getCatDetections);

export default router;
