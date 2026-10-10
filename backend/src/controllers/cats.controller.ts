import type { Response } from "express";

import prisma from "../config/db.config.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { uploadImageToCloudinary } from "../services/cloudinary.service.js";
import { UNKNOWN_ALBUM_NAME } from "../utils/constants.js";
import { parseIdParam } from "../utils/validators.js";

// ============================================================
// HELPERS
// ============================================================

const cleanName = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const cleanOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned || null;
};

const isReservedName = (name: string): boolean =>
  name.toLowerCase() === UNKNOWN_ALBUM_NAME.toLowerCase();

const parseAge = (value: unknown): number | null | "invalid" => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const age = Number(value);

  return Number.isInteger(age) && age >= 0 ? age : "invalid";
};

const parseBirthdate = (value: unknown): Date | null | "invalid" => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return "invalid";
  }

  const birthdate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(birthdate.getTime()) || birthdate > new Date()) {
    return "invalid";
  }

  return birthdate;
};

const findDuplicateName = (
  profileId: string,
  name: string,
  excludeCatId?: string,
) =>
  prisma.cats.findFirst({
    where: {
      profile_id: profileId,

      name: {
        equals: name,
        mode: "insensitive",
      },

      ...(excludeCatId
        ? {
            cat_id: {
              not: excludeCatId,
            },
          }
        : {}),
    },
  });

// ============================================================
// CREATE CAT
// ============================================================

export const createCat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const body = req.body ?? {};

    const name = cleanName(body.name);

    if (!name) {
      return res.status(400).json({
        error: "Cat name is required",
      });
    }

    if (isReservedName(name)) {
      return res.status(400).json({
        error: `"${UNKNOWN_ALBUM_NAME}" is a reserved name`,
      });
    }

    const age = parseAge(body.age);

    if (age === "invalid") {
      return res.status(400).json({
        error: "Age must be a whole number",
      });
    }

    const birthdate = parseBirthdate(body.birthdate);

    if (birthdate === "invalid") {
      return res.status(400).json({
        error: "Invalid birthdate",
      });
    }

    const duplicateCat = await findDuplicateName(req.profileId, name);

    if (duplicateCat) {
      return res.status(409).json({
        error: "You already have a cat with this name",
      });
    }

    const cat = await prisma.cats.create({
      data: {
        profile_id: req.profileId,
        name,
        breed: cleanOptionalString(body.breed),
        sex: cleanOptionalString(body.sex),
        age,
        birthdate,
        description: cleanOptionalString(body.description),
      },
    });

    return res.status(201).json({
      cat,
    });
  } catch (error) {
    console.error("Create cat error:", error);

    return res.status(500).json({
      error: "Failed to create cat",
    });
  }
};

// ============================================================
// GET ALL CATS
// ============================================================

export const getMyCats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const name = cleanName(req.query.name);

    const cats = await prisma.cats.findMany({
      where: {
        profile_id: req.profileId,

        ...(name
          ? {
              name: {
                equals: name,
                mode: "insensitive" as const,
              },
            }
          : {}),
      },

      orderBy: {
        created_at: "desc",
      },

      include: {
        cat_images: true,

        emotion_detections: {
          include: {
            emotion_categories: true,
          },
        },
      },
    });

    return res.json({
      cats,
    });
  } catch (error) {
    console.error("Get cats error:", error);

    return res.status(500).json({
      error: "Failed to fetch cats",
    });
  }
};

// ============================================================
// GET CAT DETECTIONS
// ============================================================

export const getCatDetections = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const catId = parseIdParam(req.params.catId);

    if (!catId) {
      return res.status(400).json({
        error: "Invalid cat ID",
      });
    }

    const cat = await prisma.cats.findFirst({
      where: {
        cat_id: catId,
        profile_id: req.profileId,
      },
    });

    if (!cat) {
      return res.status(404).json({
        error: "Cat not found",
      });
    }

    const detections = await prisma.emotion_detections.findMany({
      where: {
        cat_id: catId,
      },

      orderBy: {
        detected_at: "desc",
      },

      include: {
        cat_images: true,
        emotion_categories: true,
      },
    });

    return res.json({
      detections,
    });
  } catch (error) {
    console.error("Get cat detections error:", error);

    return res.status(500).json({
      error: "Failed to fetch detection history",
    });
  }
};

// ============================================================
// UPDATE CAT
// ============================================================

export const updateCat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const catId = parseIdParam(req.params.catId);

    if (!catId) {
      return res.status(400).json({
        error: "Invalid cat ID",
      });
    }

    // Make sure the cat belongs to the logged-in user
    const existingCat = await prisma.cats.findFirst({
      where: {
        cat_id: catId,
        profile_id: req.profileId,
      },
    });

    if (!existingCat) {
      return res.status(404).json({
        error: "Cat not found",
      });
    }

    const body = req.body ?? {};

    // ========================================================
    // NAME
    // ========================================================

    let name: string | undefined;

    if (body.name !== undefined) {
      name = cleanName(body.name);

      if (!name) {
        return res.status(400).json({
          error: "Cat name cannot be empty",
        });
      }

      /*
       * An existing "Unknown Cats" record CAN be renamed.
       *
       * This is important because your detection endpoint now
       * creates a temporary Unknown Cats record for each
       * unassigned detection.
       *
       * However, a normal cat cannot be manually renamed TO
       * "Unknown Cats".
       */
      if (isReservedName(name) && !isReservedName(existingCat.name)) {
        return res.status(400).json({
          error: `"${UNKNOWN_ALBUM_NAME}" is a reserved name`,
        });
      }

      const duplicateCat = await findDuplicateName(req.profileId, name, catId);

      if (duplicateCat) {
        return res.status(409).json({
          error: "You already have a cat with this name",
        });
      }
    }

    // ========================================================
    // AGE
    // ========================================================

    let age: number | null | undefined;

    if (body.age !== undefined) {
      const parsedAge = parseAge(body.age);

      if (parsedAge === "invalid") {
        return res.status(400).json({
          error: "Age must be a whole number",
        });
      }

      age = parsedAge;
    }

    // ========================================================
    // BIRTHDATE
    // ========================================================

    let birthdate: Date | null | undefined;

    if (body.birthdate !== undefined) {
      const parsedBirthdate = parseBirthdate(body.birthdate);

      if (parsedBirthdate === "invalid") {
        return res.status(400).json({
          error: "Invalid birthdate",
        });
      }

      birthdate = parsedBirthdate;
    }

    // ========================================================
    // PROFILE IMAGE
    // ========================================================

    let profileImageUrl: string | undefined;

    if (req.file) {
      const uploadedImage = await uploadImageToCloudinary(
        req.file.buffer,
        `feeline/${req.profileId}`
      );

      profileImageUrl = uploadedImage.url;
    }

    // ========================================================
    // UPDATE DATABASE
    // ========================================================

    const updatedCat = await prisma.cats.update({
      where: {
        cat_id: catId,
      },

      data: {
        ...(name !== undefined
          ? {
              name,
            }
          : {}),

        ...(body.breed !== undefined
          ? {
              breed: cleanOptionalString(body.breed),
            }
          : {}),

        ...(body.sex !== undefined
          ? {
              sex: cleanOptionalString(body.sex),
            }
          : {}),

        ...(age !== undefined
          ? {
              age,
            }
          : {}),

        ...(birthdate !== undefined
          ? {
              birthdate,
            }
          : {}),

        ...(body.description !== undefined
          ? {
              description: cleanOptionalString(body.description),
            }
          : {}),

        ...(profileImageUrl !== undefined
          ? {
              profile_image_url: profileImageUrl,
            }
          : {}),
      },
    });

    return res.json({
      cat: updatedCat,
    });
  } catch (error) {
    console.error("Update cat error:", error);

    return res.status(500).json({
      error: "Failed to update cat",
    });
  }
};

// ============================================================
// DELETE CAT
// ============================================================

export const deleteCat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const catId = parseIdParam(req.params.catId);

    if (!catId) {
      return res.status(400).json({
        error: "Invalid cat ID",
      });
    }

    const existingCat = await prisma.cats.findFirst({
      where: {
        cat_id: catId,
        profile_id: req.profileId,
      },
    });

    if (!existingCat) {
      return res.status(404).json({
        error: "Cat not found",
      });
    }

    await prisma.cats.delete({
      where: {
        cat_id: catId,
      },
    });

    return res.json({
      message: "Cat deleted successfully",
    });
  } catch (error) {
    console.error("Delete cat error:", error);

    return res.status(500).json({
      error: "Failed to delete cat",
    });
  }
};
