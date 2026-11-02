
import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

import prisma from "../config/db.config.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

import {
  getAccountCloudinaryImageIds,
} from "../services/cloudinary.service.js";

import {
  processAccountDeletionJob,
} from "../services/accountDeletion.service.js";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// ============================================================
// GOOGLE LOGIN
// ============================================================

export const googleLogin = async (
  req: Request,
  res: Response
) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: "Missing idToken",
      });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const jwtSecret = process.env.JWT_SECRET;

    if (!googleClientId || !jwtSecret) {
      console.error(
        "GOOGLE_CLIENT_ID or JWT_SECRET is missing"
      );

      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    // Verify the Google ID token.
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.sub ||
      !payload.email
    ) {
      return res.status(401).json({
        error: "Invalid Google token",
      });
    }

    const {
      sub: googleId,
      email,
      given_name,
      family_name,
      picture,
    } = payload;

    // Find user by Google account ID.
    let profile = await prisma.profiles.findUnique({
      where: {
        google_id: googleId,
      },
    });

    // Create a profile on first login.
    if (!profile) {
      profile = await prisma.profiles.create({
        data: {
          google_id: googleId,
          email,
          first_name: given_name ?? null,
          last_name: family_name ?? null,
          profile_image_url: picture ?? null,
        },
      });
    }

    // Create the FeELINE session token.
    const token = jwt.sign(
      {
        profileId: profile.profile_id,
      },
      jwtSecret,
      {
        expiresIn: "30d",
      }
    );

    return res.status(200).json({
      token,
      profile: {
        id: profile.profile_id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        profileImageUrl: profile.profile_image_url,
      },
    });
  } catch (error) {
    console.error(
      "Google login error:",
      error
    );

    return res.status(401).json({
      error: "Google authentication failed",
    });
  }
};

// ============================================================
// GET CURRENT LOGGED-IN USER
// ============================================================

export const getMe = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const profileId = req.profileId;

    if (!profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const profile = await prisma.profiles.findUnique({
      where: {
        profile_id: profileId,
      },
    });

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    return res.status(200).json({
      profile: {
        id: profile.profile_id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        profileImageUrl: profile.profile_image_url,
      },
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      error: "Failed to get profile",
    });
  }
};


 // ============================================================
 // DELETE FEELINE ACCOUNT
 // DELETE /api/auth/account
 // ============================================================

interface DeletionProfile {
  profile_id: string;
  google_id: string;
  email: string | null;
}

interface VerifiedGoogleIdentity {
  sub?: string;
  iat?: number;
}

export interface DeleteAccountDependencies {
  findProfile: (
    profileId: string
  ) => Promise<DeletionProfile | null>;

  verifyGoogleIdentity: (
    idToken: string,
    audience: string
  ) => Promise<VerifiedGoogleIdentity | null>;

  getImageIds: (
    profileId: string
  ) => Promise<string[]>;

  deleteAccountTransaction: (
    profileId: string,
    imageIds: string[]
  ) => Promise<string>;

  cleanupJob: (
    jobId: string
  ) => Promise<boolean>;
}

// ============================================================
// PRODUCTION DEPENDENCIES
// ============================================================

const defaultDeleteAccountDependencies: DeleteAccountDependencies = {
  findProfile: async (profileId) => {
    return prisma.profiles.findUnique({
      where: {
        profile_id: profileId,
      },
      select: {
        profile_id: true,
        google_id: true,
        email: true,
      },
    });
  },

  verifyGoogleIdentity: async (idToken, audience) => {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return null;
    }

    return {
      sub: payload.sub,
      iat: payload.iat,
    };
  },

  getImageIds: getAccountCloudinaryImageIds,

  deleteAccountTransaction: async (
    profileId,
    imageIds
  ) => {
    // Both operations run in one PostgreSQL transaction.
    // A failure causes Prisma to roll back the transaction.

    return prisma.$transaction(async (tx) => {
      const job = await tx.account_deletion_jobs.create({
        data: {
          profile_id: profileId,
          cloudinary_public_ids: imageIds,
          status: "pending",
          retry_count: 0,
        },
      });

      // Remove account-linked feedback.
      await tx.feedback.deleteMany({
        where: {
          profile_id: profileId,
        },
      });

      // Related cats, images, and detections are removed
      // according to the existing database cascade rules.
      await tx.profiles.delete({
        where: {
          profile_id: profileId,
        },
      });

      return job.job_id;
    });
  },

  cleanupJob: processAccountDeletionJob,
};

// ============================================================
// CREATE TESTABLE DELETE ACCOUNT CONTROLLER
// ============================================================

export function createDeleteAccountHandler(
  dependencies: DeleteAccountDependencies
) {
  return async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      // ======================================================
      // 1. VALIDATE REQUEST
      // ======================================================

      const profileId = req.profileId;
      const { idToken, confirmation } = req.body ?? {};

      if (!profileId) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      if (
        confirmation !== "DELETE MY ACCOUNT" ||
        typeof idToken !== "string" ||
        !idToken.trim()
      ) {
        return res.status(400).json({
          error: "Account deletion confirmation is required",
        });
      }

      const googleClientId = process.env.GOOGLE_CLIENT_ID;

      if (!googleClientId) {
        return res.status(500).json({
          error: "Google authentication is not configured",
        });
      }

      // ======================================================
      // 2. FIND ACCOUNT
      // ======================================================

      const profile = await dependencies.findProfile(
        profileId
      );

      if (!profile) {
        return res.status(404).json({
          error: "FeELINE account not found",
        });
      }

      // ======================================================
      // 3. VERIFY GOOGLE IDENTITY
      // ======================================================

      let googlePayload: VerifiedGoogleIdentity | null;

      try {
        googlePayload =
          await dependencies.verifyGoogleIdentity(
            idToken,
            googleClientId
          );
      } catch {
        return res.status(401).json({
          error: "Google identity verification failed",
        });
      }

      if (!googlePayload) {
        return res.status(401).json({
          error: "Google identity verification failed",
        });
      }

      if (googlePayload.sub !== profile.google_id) {
        return res.status(403).json({
          error: "Google account does not match",
        });
      }

      // ======================================================
      // 4. COLLECT IMAGE IDS
      // ======================================================

      const imageIds = await dependencies.getImageIds(
        profileId
      );

      // ======================================================
      // 5. DATABASE TRANSACTION
      // ======================================================

      const jobId =
        await dependencies.deleteAccountTransaction(
          profileId,
          imageIds
        );

      // ======================================================
      // 6. PROCESS CLOUDINARY CLEANUP
      // ======================================================

      let cleanupCompleted = false;

      try {
        cleanupCompleted =
          await dependencies.cleanupJob(jobId);
      } catch (error) {
        console.error(
          "Account cleanup processing error:",
          error
        );
      }

      // ======================================================
      // 7. RETURN RESPONSE
      // ======================================================

      if (!cleanupCompleted) {
        return res.status(202).json({
          success: true,
          accountDeleted: true,
          imageCleanupStatus: "pending",
          message:
            "Your FeELINE account has been deleted. " +
            "Image cleanup is still pending.",
        });
      }

      return res.status(200).json({
        success: true,
        accountDeleted: true,
        imageCleanupStatus: "completed",
        message:
          "Your FeELINE account and associated images " +
          "have been deleted.",
      });
    } catch (error) {
      const prismaError = error as {
        code?: string;
        meta?: {
          target?: string | string[];
        };
      };

      const target = prismaError.meta?.target;

      const isDuplicateDeletionJob =
        prismaError.code === "P2002" &&
        (
          (Array.isArray(target) &&
            target.includes("profile_id")) ||
          target === "account_deletion_jobs_profile_id_unique"
        );

      if (isDuplicateDeletionJob) {
        return res.status(409).json({
          error:
            "Account deletion is already being processed.",
        });
      }

      console.error(
        "Delete account failed:",
        error
      );
      return res.status(500).json({
        error:
          "Account deletion could not be completed. " +
          "Please contact FeELINE support.",
      });
    }
  };
}

// ============================================================
// PRODUCTION CONTROLLER
// ============================================================

export const deleteAccount = createDeleteAccountHandler(
  defaultDeleteAccountDependencies
);
