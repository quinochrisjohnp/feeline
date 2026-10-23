
import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

// ============================================================
// PROTECT ALL ADMIN ROUTES
// ============================================================

router.use(authenticate, requireAdmin);

// ============================================================
// ADMIN AUTHORIZATION TEST ENDPOINT
// ============================================================

router.get("/test", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Admin access verified",
  });
});

export default router;
