import type { Response } from "express";

import type { AuthRequest } from "../middleware/auth.middleware.js";
import { uploadImageToCloudinary } from "../services/cloudinary.service.js";
import { UNKNOWN_ALBUM_NAME } from "../utils/constants.js";
import { isUuid } from "../utils/validators.js";
import prisma from "../config/db.config.js";

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

    // --------------------------------------------------------
    // TEMPORARY DETECTION RESULT
    // --------------------------------------------------------
    // Replace this later with the Python/FastAPI AI response.
    // Mobile mock detection is no longer used.

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

    const imageUrl =
      await uploadImageToCloudinary(
        req.file.buffer,
        `feeline/${req.profileId}`
      );

    // --------------------------------------------------------
    // DATABASE
    // --------------------------------------------------------
    //
    // At this point the user has NOT chosen an album yet.
    // We therefore create a temporary Unknown Cats record.
    //
    // Later:
    // PATCH /api/detection/:detectionId/album
    // moves the image + detection to the chosen cat.
    // --------------------------------------------------------

    const result = await prisma.$transaction(
      async (tx) => {
        const temporaryCat =
          await tx.cats.create({
            data: {
              profile_id: req.profileId!,
              name: UNKNOWN_ALBUM_NAME,
            },
          });

        let emotionCategory =
          await tx.emotion_categories.findUnique({
            where: {
              emotion_name:
                detectionResult.emotion,
            },
          });

        if (!emotionCategory) {
          emotionCategory =
            await tx.emotion_categories.create({
              data: {
                emotion_name:
                  detectionResult.emotion,
              },
            });
        }

        const catImage =
          await tx.cat_images.create({
            data: {
              cat_id:
                temporaryCat.cat_id,
              image_url: imageUrl,
            },
          });

        const detection =
          await tx.emotion_detections.create({
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
          });

        return {
          temporaryCat,
          catImage,
          detection,
        };
      }
    );

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

    return res.status(500).json({
      error: "Failed to process image",
    });
  }
};

// ============================================================
// PATCH /api/detection/:detectionId/album
//
// Reassign an already-saved detection/image from its temporary
// Unknown Cats owner to a real cat selected by the user.
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

    const detectionId =
      Array.isArray(req.params.detectionId)
        ? req.params.detectionId[0]
        : req.params.detectionId;

    const { catId } = req.body;

    if (
      !detectionId ||
      !isUuid(detectionId)
    ) {
      return res.status(400).json({
        error: "Invalid detectionId",
      });
    }

    if (
      typeof catId !== "string" ||
      !isUuid(catId)
    ) {
      return res.status(400).json({
        error: "Invalid catId",
      });
    }

    // --------------------------------------------------------
    // Find detection
    // --------------------------------------------------------

    const detection =
      await prisma.emotion_detections.findUnique({
        where: {
          detection_id: detectionId,
        },
      });

    if (!detection) {
      return res.status(404).json({
        error: "Detection not found",
      });
    }

    // --------------------------------------------------------
    // Verify the current detection belongs to this user.
    // --------------------------------------------------------

    const currentCat =
      await prisma.cats.findFirst({
        where: {
          cat_id: detection.cat_id,
          profile_id: req.profileId,
        },
      });

    if (!currentCat) {
      return res.status(404).json({
        error: "Detection not found",
      });
    }

    // --------------------------------------------------------
    // Verify selected destination cat belongs to this user.
    // --------------------------------------------------------

    const targetCat =
      await prisma.cats.findFirst({
        where: {
          cat_id: catId,
          profile_id: req.profileId,
        },
      });

    if (!targetCat) {
      return res.status(404).json({
        error: "Cat not found",
      });
    }

    const oldCatId =
      detection.cat_id;

    // Already assigned there.
    if (oldCatId === targetCat.cat_id) {
      return res.json({
        message:
          "Detection already belongs to this cat.",
        catId: targetCat.cat_id,
        detectionId:
          detection.detection_id,
        imageId:
          detection.image_id,
      });
    }

    // --------------------------------------------------------
    // Move BOTH records together.
    // --------------------------------------------------------

    await prisma.$transaction(
      async (tx) => {
        await tx.emotion_detections.update({
          where: {
            detection_id: detectionId,
          },

          data: {
            cat_id: targetCat.cat_id,
          },
        });

        if (detection.image_id) {
          await tx.cat_images.update({
            where: {
              image_id:
                detection.image_id,
            },

            data: {
              cat_id:
                targetCat.cat_id,
            },
          });
        }
      }
    );

    // --------------------------------------------------------
    // Delete the temporary Unknown Cats row if nothing else
    // still uses it.
    // --------------------------------------------------------

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
        "Detection assigned successfully.",

      catId:
        targetCat.cat_id,

      detectionId:
        detection.detection_id,

      imageId:
        detection.image_id,
    });
  } catch (error) {
    console.error(
      "Assign detection error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to assign detection to cat",
    });
  }
};