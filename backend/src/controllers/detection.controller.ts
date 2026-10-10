import type { Response } from "express";

import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "../services/cloudinary.service.js";
import { UNKNOWN_ALBUM_NAME } from "../utils/constants.js";
import { isUuid } from "../utils/validators.js";
import prisma from "../config/db.config.js";

// ============================================================
// GET /api/detection
//
// Returns every persisted detection belonging to the logged-in
// user.
//
// Temporary database cats named "Unknown Cats" are marked with
// isUnknown=true. The mobile app combines all of those temporary
// rows into its single Unknown Cats system album.
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

    const detections =
      await prisma.emotion_detections.findMany({
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
          detection.image_id &&
          detection.cat_images
      )
      .map((detection) => ({
        detectionId:
          detection.detection_id,

        imageId:
          detection.image_id!,

        imageUrl:
          detection.cat_images!.image_url,

        catId:
          detection.cat_id,

        isUnknown:
          detection.cats.name ===
          UNKNOWN_ALBUM_NAME,

        isSavedToAlbum:
          detection.cat_images!.is_saved_to_album,

        emotion:
          detection.emotion_categories
            .emotion_name,

        confidence:
          detection.confidence_score
            ? Number(
                detection.confidence_score
              )
            : 0,

        capturedAt:
          (
            detection.cat_images!
              .created_at ??
            detection.detected_at ??
            detection.created_at ??
            new Date()
          ).toISOString(),

        detectedAt:
          (
            detection.detected_at ??
            detection.created_at ??
            detection.cat_images!
              .created_at ??
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
      error:
        "Failed to fetch detection history",
    });
  }
};

// ============================================================
// POST /api/detection
//
// Immediately:
// 1. Upload image to Cloudinary
// 2. Create temporary Unknown Cats owner
// 3. Save cat_images
// 4. Save emotion_detections
// 5. Return result to mobile
//
// The user chooses the final album AFTER this.
// ============================================================

export const detectEmotion = async (
  req: AuthRequest,
  res: Response
) => {
  let uploadedPublicId:
    string | null = null;

  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error:
          "No image file provided",
      });
    }

    // --------------------------------------------------------
    // TEMPORARY DETECTION RESULT
    // --------------------------------------------------------

    const detectionResult = {
      emotion: "Angry",
      confidence: 0.9,

      recommendations: [
        "Avoid physical interaction for now, as your cat may react defensively.",
        "Give your cat space and allow them time to calm down.",
        "Identify and remove possible triggers such as loud noise, sudden movements, or overstimulation.",
      ],
    };

    // --------------------------------------------------------
    // CLOUDINARY
    // --------------------------------------------------------

    const uploadedImage =
      await uploadImageToCloudinary(
        req.file.buffer,
        `feeline/${req.profileId}`
      );

    const imageUrl =
      uploadedImage.url;

    uploadedPublicId =
      uploadedImage.publicId;

    // --------------------------------------------------------
    // DATABASE TRANSACTION
    // --------------------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
          // User hasn't chosen a real album yet.
          // Every new detection begins in Unknown Cats.
          const temporaryCat =
            await tx.cats.create({
              data: {
                profile_id:
                  req.profileId!,

                name:
                  UNKNOWN_ALBUM_NAME,
              },
            });

          let emotionCategory =
            await tx.emotion_categories.findUnique(
              {
                where: {
                  emotion_name:
                    detectionResult.emotion,
                },
              }
            );

          if (!emotionCategory) {
            emotionCategory =
              await tx.emotion_categories.create(
                {
                  data: {
                    emotion_name:
                      detectionResult.emotion,
                  },
                }
              );
          }

          const catImage =
            await tx.cat_images.create({
              data: {
                cat_id:
                  temporaryCat.cat_id,

                image_url:
                  imageUrl,

                is_saved_to_album: false,
              },
            });

          const detection =
            await tx.emotion_detections.create(
              {
                data: {
                  cat_id:
                    temporaryCat.cat_id,

                  image_id:
                    catImage.image_id,

                  emotion_id:
                    emotionCategory.emotion_id,

                  confidence_score:
                    detectionResult.confidence,
                },
              }
            );

          return {
            temporaryCat,
            catImage,
            detection,
          };
        }
      );

    // Database succeeded.
    //
    // From this point forward, Cloudinary image belongs
    // to a persisted DB record and must NOT be cleaned up.
    uploadedPublicId = null;

    return res.status(201).json({
      catId:
        result.temporaryCat.cat_id,

      imageId:
        result.catImage.image_id,

      imageUrl,

      emotion:
        detectionResult.emotion,

      confidence:
        detectionResult.confidence,

      recommendations:
        detectionResult.recommendations,

      detectionId:
        result.detection.detection_id,
    });
  } catch (error) {
    console.error(
      "Emotion detection error:",
      error
    );

    // --------------------------------------------------------
    // CLOUDINARY ROLLBACK
    // --------------------------------------------------------
    //
    // If Cloudinary succeeded but something afterward failed,
    // remove the uploaded image so we don't leave an orphan.

    if (uploadedPublicId) {
      try {
        await deleteImageFromCloudinary(
          uploadedPublicId
        );

        console.log(
          "Rolled back Cloudinary image:",
          uploadedPublicId
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "Cloudinary rollback failed:",
          cleanupError
        );
      }
    }

    return res.status(500).json({
      error:
        "Failed to process image",
    });
  }
};
// ============================================================
// PATCH /api/detection/:detectionId/album
//
// Move an existing image + detection from its temporary
// Unknown Cats owner to a real cat.
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

    const detectionId = Array.isArray(req.params.detectionId)
      ? req.params.detectionId[0]
      : req.params.detectionId;

    const { catId, saveToUnknown } = req.body ?? {};

    // Validate detection ID
    if (!detectionId || !isUuid(detectionId)) {
      return res.status(400).json({
        error: "Invalid detectionId",
      });
    }

    // Exactly one destination must be provided
    if (
      saveToUnknown !== undefined &&
      typeof saveToUnknown !== "boolean"
    ) {
      return res.status(400).json({
        error: "Invalid saveToUnknown value",
      });
    }

    if (saveToUnknown === true) {
      if (catId !== undefined && catId !== null) {
        return res.status(400).json({
          error: "Do not provide catId when saving to Unknown Album",
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

    // Find detection and verify user ownership
    const detection = await prisma.emotion_detections.findFirst({
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

    if (!detection.image_id || !detection.cat_images) {
      return res.status(400).json({
        error: "Detection has no image to save",
      });
    }

    const currentCat = detection.cats;
    const oldCatId = detection.cat_id;
    const imageId = detection.image_id;

    // ==========================================
    // OPTION 1: SAVE TO UNKNOWN ALBUM
    // ==========================================
    if (saveToUnknown === true) {
      if (currentCat.name !== UNKNOWN_ALBUM_NAME) {
        return res.status(400).json({
          error:
            "Detection belongs to a personal cat album",
        });
      }

      // No image re-upload or new detection.
      // Only mark the existing image as saved.
      await prisma.cat_images.update({
        where: {
          image_id: imageId,
        },
        data: {
          is_saved_to_album: true,
        },
      });

      return res.json({
        message: "Image saved to Unknown Album successfully.",
        catId: oldCatId,
        detectionId,
        imageId,
      });
    }

    // ==========================================
    // OPTION 2: SAVE TO PERSONAL CAT ALBUM
    // ==========================================

    const targetCat = await prisma.cats.findFirst({
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

    // Already belongs to the selected cat.
    // Still mark it as explicitly saved.
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
        message: "Image saved to album successfully.",
        catId: targetCat.cat_id,
        detectionId,
        imageId,
      });
    }

    // ==========================================
    // MOVE IMAGE AND DETECTION TO PERSONAL CAT
    // ==========================================

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

    // ==========================================
    // CLEAN UP EMPTY TEMPORARY UNKNOWN CAT
    // ==========================================

    if (currentCat.name === UNKNOWN_ALBUM_NAME) {
      const [remainingImages, remainingDetections] =
        await Promise.all([
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
      message: "Image saved to album successfully.",
      catId: targetCat.cat_id,
      detectionId,
      imageId,
    });
  } catch (error) {
    console.error("Assign detection error:", error);

    return res.status(500).json({
      error: "Failed to save detection to album",
    });
  }
};

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

    const detectionId = Array.isArray(req.params.detectionId)
      ? req.params.detectionId[0]
      : req.params.detectionId;

    if (!detectionId || !isUuid(detectionId)) {
      return res.status(400).json({
        error: "Invalid detection ID",
      });
    }

    // Find the detection and verify ownership.
    const detection = await prisma.emotion_detections.findFirst({
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

    if (!detection.image_id || !detection.cat_images) {
      return res.status(404).json({
        error: "Detection image not found",
      });
    }

    // Remove only the Album association.
    // Preserve the detection, cat association,
    // and Cloudinary image.
    await prisma.cat_images.update({
      where: {
        image_id: detection.image_id,
      },
      data: {
        is_saved_to_album: false,
      },
    });

    return res.json({
      message: "Image removed from Album successfully.",
      detectionId,
      imageId: detection.image_id,
    });
  } catch (error) {
    console.error("Remove detection from Album error:", error);

    return res.status(500).json({
      error: "Failed to remove image from Album",
    });
  }
};