import type { NextFunction, Response } from "express";

import prisma from "../config/db.config.js";
import type { AuthRequest } from "./auth.middleware.js";

// ============================================================
// ADMIN AUTHORIZATION MIDDLEWARE
// ============================================================

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  // The authenticate middleware must run first.
  if (!req.profileId) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  try {
    // Retrieve the user's current role from the database.
    const profile = await prisma.profiles.findUnique({
      where: {
        profile_id: req.profileId,
      },
      select: {
        role: true,
      },
    });

    // Reject missing profiles or non-admin users.
    if (!profile || profile.role !== "admin") {
      return res.status(403).json({
        error: "Admin access required",
      });
    }

    // The authenticated user is an administrator.
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      error: "Unable to verify admin access",
    });
  }
};
