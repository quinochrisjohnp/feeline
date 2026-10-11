
import type { Response } from "express";

import prisma from "../config/db.config.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "../services/cloudinary.service.js";

import { UNKNOWN_ALBUM_NAME } from "../utils/constants.js";
import { isUuid } from "../utils/validators.js";

// ============================================================
// GET /api/detection
// ============================================================

export const getDetectionHistory = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const detections = await prisma.emotion_detections.findMany({
      where: {
        cats: {
          profile_id: req.profileId,
        },
      },
      include: {
        cats: true,
        cat_images: true,
        emotion_categories: true,
      },
      orderBy: {
        detected_at: "desc",
      },
    });

    const history = detections
      .filter(
        (detection) =>
          detection.image_id && detection.cat_images
      )
      .map((detection) => ({
        detectionId: detection.detection_id,
        imageId: detection.image_id!,
        imageUrl: detection.cat_images!.image_url,
        catId: detection.cat_id,
        isUnknown:
          detection.cats.name === UNKNOWN_ALBUM_NAME,
        isSavedToAlbum:
          detection.cat_images!.is_saved_to_album,
        emotion:
          detection.emotion_categories.emotion_name,
        confidence: detection.confidence_score
          ? Number(detection.confidence_score)
          : 0,
        capturedAt: (
          detection.cat_images!.created_at ??
          detection.detected_at ??
          detection.created_at ??
          new Date()
        ).toISOString(),
        detectedAt: (
          detection.detected_at ??
          detection.created_at ??
          detection.cat_images!.created_at ??
          new Date()
        ).toISOString(),
      }));

    return res.json({
      detections: history,
    });
  } catch (error) {
    console.error(
      "Get detection history error:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch detection history",
    });
  }
};

// ============================================================
// POST /api/detection
//
// Automatically uploads the image to Cloudinary and
// saves its detection record to PostgreSQL.
//
// Performance logging measures:
// - Cloudinary upload
// - Temporary Unknown Cat creation
// - Emotion category lookup/creation
// - Image record creation
// - Detection record creation
// - Database transaction overhead
// - Total controller processing time
// ============================================================

export const detectEmotion = async (
  req: AuthRequest,
  res: Response
) => {
  let uploadedPublicId: string | null = null;

  const requestStart = Date.now();

  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "No image file provided",
      });
    }

    console.log(
      "[FeELINE Performance] Detection request started"
    );

    console.log(
      `[FeELINE Performance] Image size: ${(
        req.file.buffer.length /
        1024 /
        1024
      ).toFixed(2)} MB`
    );

    // ========================================================
    // TEMPORARY DETECTION RESULT
    //
    // Preserved from your existing implementation.
    // ========================================================

    const detectionResult = {
      emotion: "Angry",
      confidence: 0.9,
      recommendations: [
        "Avoid physical interaction for now, as your cat may react defensively.",
        "Give your cat space and allow them time to calm down.",
        "Identify and remove possible triggers such as loud noise, sudden movements, or overstimulation.",
      ],
    };

    // ========================================================
    // CLOUDINARY UPLOAD
    // ========================================================

    const cloudinaryStart = Date.now();

    console.log(
      "[FeELINE Performance] Starting Cloudinary upload..."
    );

    const uploadedImage =
      await uploadImageToCloudinary(
        req.file.buffer,
        `feeline/${req.profileId}`
      );

    console.log(
      `[FeELINE Performance] Cloudinary upload: ${
        Date.now() - cloudinaryStart
      } ms`
    );

    const imageUrl = uploadedImage.url;
    uploadedPublicId = uploadedImage.publicId;

    // ========================================================
    // DATABASE TRANSACTION
    // ========================================================

    const databaseStart = Date.now();

    let totalQueryDuration = 0;

    console.log(
      "[FeELINE Performance] Starting database transaction..."
    );

    const result = await prisma.$transaction(
      async (tx) => {
        // ----------------------------------------------------
        // 1. CREATE TEMPORARY UNKNOWN CAT
        // ----------------------------------------------------

        const temporaryCatStart = Date.now();

        const temporaryCat = await tx.cats.create({
          data: {
            profile_id: req.profileId!,
            name: UNKNOWN_ALBUM_NAME,
          },
        });

        const temporaryCatDuration =
          Date.now() - temporaryCatStart;

        totalQueryDuration += temporaryCatDuration;

        console.log(
          `[FeELINE Performance] Create Unknown Cat: ${temporaryCatDuration} ms`
        );

        // ----------------------------------------------------
        // 2. FIND EMOTION CATEGORY
        // ----------------------------------------------------

        const emotionLookupStart = Date.now();

        let emotionCategory =
          await tx.emotion_categories.findUnique({
            where: {
              emotion_name: detectionResult.emotion,
            },
          });

        const emotionLookupDuration =
          Date.now() - emotionLookupStart;

        totalQueryDuration += emotionLookupDuration;

        console.log(
          `[FeELINE Performance] Find Emotion Category: ${emotionLookupDuration} ms`
        );

        // ----------------------------------------------------
        // 3. CREATE EMOTION CATEGORY IF MISSING
        // ----------------------------------------------------

        if (!emotionCategory) {
          const emotionCreateStart = Date.now();

          emotionCategory =
            await tx.emotion_categories.create({
              data: {
                emotion_name: detectionResult.emotion,
              },
            });

          const emotionCreateDuration =
            Date.now() - emotionCreateStart;

          totalQueryDuration += emotionCreateDuration;

          console.log(
            `[FeELINE Performance] Create Emotion Category: ${emotionCreateDuration} ms`
          );
        }

        // ----------------------------------------------------
        // 4. CREATE IMAGE RECORD
        // ----------------------------------------------------

        const imageRecordStart = Date.now();

        const catImage = await tx.cat_images.create({
          data: {
            cat_id: temporaryCat.cat_id,
            image_url: imageUrl,
            is_saved_to_album: false,
          },
        });

        const imageRecordDuration =
          Date.now() - imageRecordStart;

        totalQueryDuration += imageRecordDuration;

        console.log(
          `[FeELINE Performance] Create Image Record: ${imageRecordDuration} ms`
        );

        // ----------------------------------------------------
        // 5. CREATE DETECTION RECORD
        // ----------------------------------------------------

        const detectionRecordStart = Date.now();

        const detection =
          await tx.emotion_detections.create({
            data: {
              cat_id: temporaryCat.cat_id,
              image_id: catImage.image_id,
              emotion_id: emotionCategory.emotion_id,
              confidence_score:
                detectionResult.confidence,
            },
          });

        const detectionRecordDuration =
          Date.now() - detectionRecordStart;

        totalQueryDuration += detectionRecordDuration;

        console.log(
          `[FeELINE Performance] Create Detection Record: ${detectionRecordDuration} ms`
        );

        return {
          temporaryCat,
          catImage,
          detection,
        };
      }
    );

    const databaseDuration =
      Date.now() - databaseStart;

    const transactionOverhead = Math.max(
      0,
      databaseDuration - totalQueryDuration
    );

    console.log(
      `[FeELINE Performance] Total DB Query Time: ${totalQueryDuration} ms`
    );

    console.log(
      `[FeELINE Performance] Transaction Overhead: ${transactionOverhead} ms`
    );

    console.log(
      `[FeELINE Performance] Database transaction: ${databaseDuration} ms`
    );

    // Database succeeded. Keep the Cloudinary image.
    uploadedPublicId = null;

    console.log(
      `[FeELINE Performance] Total controller time: ${
        Date.now() - requestStart
      } ms`
    );

    // ========================================================
    // RESPONSE TO MOBILE
    // ========================================================

    return res.status(201).json({
      catId: result.temporaryCat.cat_id,
      imageId: result.catImage.image_id,
      imageUrl,
      emotion: detectionResult.emotion,
      confidence: detectionResult.confidence,
      recommendations:
        detectionResult.recommendations,
      detectionId: result.detection.detection_id,
    });
  } catch (error) {
    console.error(
      "[FeELINE] Emotion detection error:",
      error
    );

    console.error(
      `[FeELINE Performance] Failed after ${
        Date.now() - requestStart
      } ms`
    );

    // Roll back the Cloudinary image if DB saving failed.
    if (uploadedPublicId) {
      try {
        await deleteImageFromCloudinary(
          uploadedPublicId
        );

        console.log(
          "Rolled back Cloudinary image:",
          uploadedPublicId
        );
      } catch (cleanupError) {
        console.error(
          "Cloudinary rollback failed:",
          cleanupError
        );
      }
    }

    return res.status(500).json({
      error: "Failed to process image",
    });
  }
};

// ============================================================
// PATCH /api/detection/:detectionId/album
//
// Save a detection to Unknown Cats or a personal cat album.
// ============================================================

export const assignDetectionToAlbum = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const detectionId = Array.isArray(
      req.params.detectionId
    )
      ? req.params.detectionId[0]
      : req.params.detectionId;

    const { catId, saveToUnknown } =
      req.body ?? {};

    if (!detectionId || !isUuid(detectionId)) {
      return res.status(400).json({
        error: "Invalid detectionId",
      });
    }

    if (
      saveToUnknown !== undefined &&
      typeof saveToUnknown !== "boolean"
    ) {
      return res.status(400).json({
        error: "Invalid saveToUnknown value",
      });
    }

    // --------------------------------------------------------
    // SAVE TO UNKNOWN ALBUM
    // --------------------------------------------------------

    if (saveToUnknown === true) {
      if (
        catId !== undefined &&
        catId !== null
      ) {
        return res.status(400).json({
          error:
            "Do not provide catId when saving to Unknown Album",
        });
      }
    } else if (
      typeof catId !== "string" ||
      !isUuid(catId)
    ) {
      return res.status(400).json({
        error: "Invalid catId",
      });
    }

    const detection =
      await prisma.emotion_detections.findFirst({
        where: {
          detection_id: detectionId,
          cats: {
            profile_id: req.profileId,
          },
        },
        include: {
          cats: true,
          cat_images: true,
        },
      });

    if (!detection) {
      return res.status(404).json({
        error: "Detection not found",
      });
    }

    if (
      !detection.image_id ||
      !detection.cat_images
    ) {
      return res.status(400).json({
        error:
          "Detection has no image to save",
      });
    }

    const currentCat = detection.cats;
    const oldCatId = detection.cat_id;
    const imageId = detection.image_id;

    if (saveToUnknown === true) {
      if (
        currentCat.name !==
        UNKNOWN_ALBUM_NAME
      ) {
        return res.status(400).json({
          error:
            "Detection belongs to a personal cat album",
        });
      }

      await prisma.cat_images.update({
        where: {
          image_id: imageId,
        },
        data: {
          is_saved_to_album: true,
        },
      });

      return res.json({
        message:
          "Image saved to Unknown Album successfully.",
        catId: oldCatId,
        detectionId,
        imageId,
      });
    }

    // --------------------------------------------------------
    // SAVE TO PERSONAL CAT ALBUM
    // --------------------------------------------------------

    const targetCat =
      await prisma.cats.findFirst({
        where: {
          cat_id: catId,
          profile_id: req.profileId,
          NOT: {
            name: UNKNOWN_ALBUM_NAME,
          },
        },
      });

    if (!targetCat) {
      return res.status(404).json({
        error: "Cat not found",
      });
    }

    if (oldCatId === targetCat.cat_id) {
      await prisma.cat_images.update({
        where: {
          image_id: imageId,
        },
        data: {
          is_saved_to_album: true,
        },
      });

      return res.json({
        message:
          "Image saved to album successfully.",
        catId: targetCat.cat_id,
        detectionId,
        imageId,
      });
    }

    // Move image and detection to the selected cat.
    await prisma.$transaction(async (tx) => {
      await tx.emotion_detections.update({
        where: {
          detection_id: detectionId,
        },
        data: {
          cat_id: targetCat.cat_id,
        },
      });

      await tx.cat_images.update({
        where: {
          image_id: imageId,
        },
        data: {
          cat_id: targetCat.cat_id,
          is_saved_to_album: true,
        },
      });
    });

    // Remove the temporary Unknown Cats row if empty.
    if (
      currentCat.name ===
      UNKNOWN_ALBUM_NAME
    ) {
      const [
        remainingImages,
        remainingDetections,
      ] = await Promise.all([
        prisma.cat_images.count({
          where: {
            cat_id: oldCatId,
          },
        }),
        prisma.emotion_detections.count({
          where: {
            cat_id: oldCatId,
          },
        }),
      ]);

      if (
        remainingImages === 0 &&
        remainingDetections === 0
      ) {
        await prisma.cats.deleteMany({
          where: {
            cat_id: oldCatId,
            profile_id: req.profileId,
            name: UNKNOWN_ALBUM_NAME,
          },
        });
      }
    }

    return res.json({
      message:
        "Image saved to album successfully.",
      catId: targetCat.cat_id,
      detectionId,
      imageId,
    });
  } catch (error) {
    console.error(
      "Assign detection error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to save detection to album",
    });
  }
};

// ============================================================
// DELETE /api/detection/:detectionId/album
//
// Remove an image from an album without deleting its
// detection history or Cloudinary image.
// ============================================================

export const removeDetectionFromAlbum = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const detectionId = Array.isArray(
      req.params.detectionId
    )
      ? req.params.detectionId[0]
      : req.params.detectionId;

    if (!detectionId || !isUuid(detectionId)) {
      return res.status(400).json({
        error: "Invalid detection ID",
      });
    }

    const detection =
      await prisma.emotion_detections.findFirst({
        where: {
          detection_id: detectionId,
          cats: {
            profile_id: req.profileId,
          },
        },
        include: {
          cat_images: true,
        },
      });

    if (!detection) {
      return res.status(404).json({
        error: "Detection not found",
      });
    }

    if (
      !detection.image_id ||
      !detection.cat_images
    ) {
      return res.status(404).json({
        error:
          "Detection image not found",
      });
    }

    await prisma.cat_images.update({
      where: {
        image_id: detection.image_id,
      },
      data: {
        is_saved_to_album: false,
      },
    });

    return res.json({
      message:
        "Image removed from Album successfully.",
      detectionId,
      imageId: detection.image_id,
    });
  } catch (error) {
    console.error(
      "Remove detection from Album error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to remove image from Album",
    });
  }
};
