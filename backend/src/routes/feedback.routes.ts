
import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { submitFeedback } from "../controllers/feedback.controller.js";

const router = Router();

// ============================================================
// SUBMIT FEEDBACK
// POST /api/feedback
// ============================================================

// Only authenticated users can submit feedback.
router.post("/", authenticate, submitFeedback);

export default router;
