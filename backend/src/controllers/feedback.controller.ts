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

    // Email is no longer accepted from the feedback form.
    const { title, subject, message } = req.body ?? {};

    if (
      typeof title !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        status: "error",
        message: "All feedback fields must be text.",
      });
    }

    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (
      !cleanTitle ||
      !cleanSubject ||
      !cleanMessage
    ) {
      return res.status(400).json({
        status: "error",
        message: "All feedback fields are required.",
      });
    }

    // Only allow the predefined feedback subjects.
    const allowedSubjects = [
      "Bug Report",
      "Feature Suggestion",
      "Emotion Detection Concern",
      "App Experience",
      "Others",
    ];

    if (!allowedSubjects.includes(cleanSubject)) {
      return res.status(400).json({
        status: "error",
        message: "Please select a valid feedback subject.",
      });
    }

    // Respect existing Prisma database column limits.
    if (
      cleanTitle.length > 150 ||
      cleanSubject.length > 255 ||
      cleanMessage.length > 5000
    ) {
      return res.status(400).json({
        status: "error",
        message: "One or more feedback fields are too long.",
      });
    }

    // Retrieve the authenticated user's email from PostgreSQL.
    const profile = await prisma.profiles.findUnique({
      where: {
        profile_id: profileId,
      },
      select: {
        profile_id: true,
        email: true,
      },
    });

    if (!profile) {
      return res.status(401).json({
        status: "error",
        message: "User profile not found.",
      });
    }

    // Save feedback using the authenticated user's email.
    const feedback = await prisma.feedback.create({
      data: {
        profile_id: profile.profile_id,
        title: cleanTitle,
        email: profile.email,
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