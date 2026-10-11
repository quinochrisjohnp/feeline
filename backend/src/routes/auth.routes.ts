import { Router } from "express";

import {
  googleLogin,
  getMe,
} from "../controllers/auth.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

const router = Router();

// Google login
router.post(
  "/google",
  googleLogin
);

// Get currently authenticated FeELINE user
router.get(
  "/me",
  authenticate,
  getMe
);

export default router;