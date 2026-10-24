
import type { Response } from "express";

import prisma from "../config/db.config.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

// ============================================================
// SUBMIT FEEDBACK
// POST /api/feedback
// ============================================================

export const submitFeedback = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const profileId = req.profileId;

    if (!profileId) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required.",
      });
    }

    const { title, email, subject, message } = req.body ?? {};

    // Validate input types before calling string methods.
    if (
      typeof title !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        status: "error",
        message: "All feedback fields must be text.",
      });
    }

    const cleanTitle = title.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    // Match the current mobile feedback form validation.
    if (
      !cleanTitle ||
      !cleanEmail ||
      !cleanSubject ||
      !cleanMessage
    ) {
      return res.status(400).json({
        status: "error",
        message: "All feedback fields are required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        status: "error",
        message: "Please enter a valid email address.",
      });
    }

    // Respect the existing Prisma database column limits.
    if (
      cleanTitle.length > 150 ||
      cleanEmail.length > 255 ||
      cleanSubject.length > 255 ||
      cleanMessage.length > 5000
    ) {
      return res.status(400).json({
        status: "error",
        message: "One or more feedback fields are too long.",
      });
    }

    // Confirm that the authenticated profile still exists.
    const profile = await prisma.profiles.findUnique({
      where: {
        profile_id: profileId,
      },
      select: {
        profile_id: true,
      },
    });

    if (!profile) {
      return res.status(401).json({
        status: "error",
        message: "User profile not found.",
      });
    }

    // Save feedback to PostgreSQL.
    const feedback = await prisma.feedback.create({
      data: {
        profile_id: profile.profile_id,
        title: cleanTitle,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
      },
      select: {
        feedback_id: true,
        title: true,
        subject: true,
        created_at: true,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Feedback submitted successfully.",
      data: feedback,
    });
  } catch (error) {
    console.error("Failed to submit feedback:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to submit feedback.",
    });
  }
};
