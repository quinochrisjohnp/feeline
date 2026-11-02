
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";
import prisma from "../config/db.config.js";

export interface AuthRequest extends Request {
  profileId?: string;
}

export interface AuthDependencies {
  findAccount: (
    profileId: string
  ) => Promise<{ account_status: string } | null>;

  isStatusCheckEnabled: () => boolean;
}

export function createAuthenticate(
  dependencies: AuthDependencies
) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    let profileId: string;

    try {
      const decoded = jwt.verify(token, jwtSecret);

      if (
        typeof decoded === "string" ||
        typeof decoded.profileId !== "string" ||
        !decoded.profileId
      ) {
        return res.status(401).json({
          error: "Invalid token payload",
        });
      }

      profileId = decoded.profileId;
    } catch {
      return res.status(401).json({
        error: "Invalid or expired token",
      });
    }

    if (dependencies.isStatusCheckEnabled()) {
      try {
        const account = await dependencies.findAccount(
          profileId
        );

        if (!account) {
          return res.status(401).json({
            error: "Account no longer exists",
          });
        }

        if (account.account_status !== "active") {
          return res.status(403).json({
            error: "Account is unavailable",
          });
        }
      } catch (error) {
        console.error(
          "Account status verification failed:",
          error
        );

        return res.status(503).json({
          error: "Unable to verify account status",
        });
      }
    }

    req.profileId = profileId;
    next();
  };
}

export const authenticate = createAuthenticate({
  findAccount: (profileId) =>
    prisma.profiles.findUnique({
      where: {
        profile_id: profileId,
      },
      select: {
        account_status: true,
      },
    }),

  isStatusCheckEnabled: () =>
    process.env.ACCOUNT_STATUS_CHECK_ENABLED === "true",
});
