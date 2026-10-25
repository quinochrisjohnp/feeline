import { Router } from "express";

import prisma from "../config/db.config.js";
import {
  authenticate,
  type AuthRequest,
} from "../middleware/auth.middleware.js";
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

// ============================================================
// ADMIN DASHBOARD STATISTICS
// GET /api/admin/stats
// ============================================================

router.get("/stats", async (_req, res) => {
  try {
    const [
      totalUsers,
      totalCats,
      totalDetections,
      totalFeedback,
    ] = await Promise.all([
      prisma.profiles.count(),
      prisma.cats.count(),
      prisma.emotion_detections.count(),
      prisma.feedback.count(),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        totalUsers,
        totalCats,
        totalDetections,
        totalFeedback,
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch admin dashboard statistics:",
      error
    );

    res.status(500).json({
      status: "error",
      message: "Failed to fetch dashboard statistics",
    });
  }
});


router.get("/users", async (_req, res) => {
  try {
    const users = await prisma.profiles.findMany({
      select: {
        profile_id: true,
        first_name: true,
        last_name: true,
        email: true,
        profile_image_url: true,
        role: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to fetch registered users",
    });
  }
});


router.get("/cats", async (_req, res) => {
  try {
    const cats = await prisma.cats.findMany({
      select: {
        cat_id: true,
        name: true,
        breed: true,
        sex: true,
        age: true,
        profile_image_url: true,
        created_at: true,
        profiles: {
          select: {
            profile_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      data: cats,
    });
  } catch (error) {
    console.error("Failed to fetch admin cats:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to fetch registered cats",
    });
  }
});


// ============================================================
// ADMIN EMOTION DETECTIONS
// GET /api/admin/detections
// ============================================================

router.get("/detections", async (_req, res) => {
  try {
    const detections = await prisma.emotion_detections.findMany({
      select: {
        detection_id: true,
        confidence_score: true,
        detected_at: true,
        cats: {
          select: {
            cat_id: true,
            name: true,
            profiles: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        emotion_categories: {
          select: {
            emotion_name: true,
          },
        },
      },
      orderBy: {
        detected_at: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      data: detections,
    });
  } catch (error) {
    console.error("Failed to fetch admin detections:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to fetch emotion detections",
    });
  }
});


// ============================================================
// ADMIN ANALYTICS
// GET /api/admin/analytics
// ============================================================

router.get("/analytics", async (_req, res) => {
  try {
    const detections = await prisma.emotion_detections.findMany({
      select: {
        confidence_score: true,
        detected_at: true,
        emotion_categories: {
          select: {
            emotion_name: true,
          },
        },
      },
    });

    const emotionCounts: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};

    let confidenceSum = 0;
    let confidenceCount = 0;

    for (const detection of detections) {
      const emotion =
        detection.emotion_categories.emotion_name;

      emotionCounts[emotion] =
        (emotionCounts[emotion] ?? 0) + 1;

      if (detection.detected_at) {
        const date = detection.detected_at
          .toISOString()
          .slice(0, 10);

        dailyCounts[date] =
          (dailyCounts[date] ?? 0) + 1;
      }

      if (detection.confidence_score !== null) {
        confidenceSum += Number(detection.confidence_score);
        confidenceCount++;
      }
    }

    const emotionDistribution = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const dailyTrends = Object.entries(dailyCounts)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const averageConfidence =
      confidenceCount > 0
        ? Number(
            ((confidenceSum / confidenceCount) * 100).toFixed(2)
          )
        : null;

    res.status(200).json({
      status: "success",
      data: {
        totalDetections: detections.length,
        averageConfidence,
        emotionDistribution,
        dailyTrends,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin analytics:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to fetch analytics data",
    });
  }
});


 // ============================================================
 // ADMIN FEEDBACK MANAGEMENT
 // GET /api/admin/feedback
 // ============================================================

router.get("/feedback", async (_req, res) => {
  try {
    const feedbackRecords = await prisma.feedback.findMany({
      select: {
        feedback_id: true,
        title: true,
        email: true,
        subject: true,
        message: true,
        created_at: true,
        profiles: {
          select: {
            profile_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      data: feedbackRecords,
    });
  } catch (error) {
    console.error("Failed to fetch admin feedback:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to fetch feedback records",
    });
  }
});


 // ============================================================
 // ADMIN PROFILE
 // GET /api/admin/profile
 // ============================================================

router.get("/profile", async (req: AuthRequest, res) => {
  try {
    const profileId = req.profileId;

    if (!profileId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const profile = await prisma.profiles.findUnique({
      where: {
        profile_id: profileId,
      },
      select: {
        profile_id: true,
        first_name: true,
        last_name: true,
        email: true,
        profile_image_url: true,
        role: true,
        created_at: true,
      },
    });

    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Admin profile not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (error) {
    console.error("Failed to fetch admin profile:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to fetch admin profile",
    });
  }
});



export default router;
