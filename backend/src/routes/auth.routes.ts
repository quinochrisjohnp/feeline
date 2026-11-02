
import { Router } from "express";

import {
  googleLogin,
  getMe,
  deleteAccount,
} from "../controllers/auth.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

const router = Router();

// Google login
router.post("/google", googleLogin);

// Get currently authenticated user
router.get("/me", authenticate, getMe);

// Delete authenticated FeELINE account
router.delete(
  "/account",
  authenticate,
  (req, res, next) => {
    if (process.env.ACCOUNT_DELETION_ENABLED !== "true") {
      return res.status(503).json({
        error: "Account deletion is temporarily unavailable",
      });
    }

    next();
  },
  deleteAccount
);


export default router;
