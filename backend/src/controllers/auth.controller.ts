import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

import prisma from "../config/db.config.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

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

    const googleClientId =
      process.env.GOOGLE_CLIENT_ID;

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!googleClientId || !jwtSecret) {
      console.error(
        "GOOGLE_CLIENT_ID or JWT_SECRET is missing"
      );

      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    // Verify token received from Google
    const ticket =
      await googleClient.verifyIdToken({
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

    // Find user using Google account ID
    let profile =
      await prisma.profiles.findUnique({
        where: {
          google_id: googleId,
        },
      });

    // Create profile if this is their first login
    if (!profile) {
      profile =
        await prisma.profiles.create({
          data: {
            google_id: googleId,
            email,
            first_name: given_name ?? null,
            last_name: family_name ?? null,
            profile_image_url: picture ?? null,
          },
        });
    }

    // Create FeELINE JWT
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
        profileImageUrl:
          profile.profile_image_url,
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

    const profile =
      await prisma.profiles.findUnique({
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
        profileImageUrl:
          profile.profile_image_url,
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