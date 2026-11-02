
import type { Response } from "express";

import prisma from "../config/db.config.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "../services/cloudinary.service.js";
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

export interface CreateCatDependencies {
  findDuplicate: typeof findDuplicateName;
  createRecord: typeof prisma.cats.create;
  uploadImage: typeof uploadImageToCloudinary;
  deleteImage: typeof deleteImageFromCloudinary;
}

export const createCreateCatHandler = (
  dependencies: CreateCatDependencies
) => async (req: AuthRequest, res: Response) => {
  const uploadedPublicIds: string[] = [];

  try {
    if (!req.profileId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const body = req.body ?? {};

    // ========================================================
    // NAME
    // ========================================================

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

    // ========================================================
    // AGE
    // ========================================================

    const age = parseAge(body.age);

    if (age === "invalid") {
      return res.status(400).json({
        error: "Age must be a whole number",
      });
    }

    // ========================================================
    // BIRTHDATE
    // ========================================================

    const birthdate = parseBirthdate(body.birthdate);

    if (birthdate === "invalid") {
      return res.status(400).json({
        error: "Invalid birthdate",
      });
    }

    // ========================================================
    // CHECK DUPLICATE NAME
    // ========================================================

    const duplicateCat = await dependencies.findDuplicate(
      req.profileId,
      name
    );

    if (duplicateCat) {
      return res.status(409).json({
        error: "You already have a cat with this name",
      });
    }

    // ========================================================
    // PROFILE IMAGE AND COVER IMAGE
    // ========================================================

    let profileImageUrl: string | undefined;
    let coverImageUrl: string | undefined;

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const profileImage = files?.profile_image?.[0];
    const coverImage = files?.cover_image?.[0];

    if (profileImage) {
      const uploadedImage = await dependencies.uploadImage(
        profileImage.buffer,
        `feeline/${req.profileId}`
      );

      profileImageUrl = uploadedImage.url;
      uploadedPublicIds.push(uploadedImage.publicId);
    }

    if (coverImage) {
      const uploadedImage = await dependencies.uploadImage(
        coverImage.buffer,
        `feeline/${req.profileId}`
      );

      coverImageUrl = uploadedImage.url;
      uploadedPublicIds.push(uploadedImage.publicId);
    }

    // ========================================================
    // CREATE CAT IN DATABASE
    // ========================================================

    const cat = await dependencies.createRecord({
      data: {
        profile_id: req.profileId,
        name,
        breed: cleanOptionalString(body.breed),
        sex: cleanOptionalString(body.sex),
        age,
        birthdate,
        description: cleanOptionalString(body.description),

        ...(profileImageUrl !== undefined
          ? {
              profile_image_url: profileImageUrl,
            }
          : {}),

        ...(coverImageUrl !== undefined
          ? {
              cover_image_url: coverImageUrl,
            }
          : {}),
      },
    });

    return res.status(201).json({
      cat,
    });

  } catch (error) {
    console.error("Create cat error:", error);

    for (const publicId of uploadedPublicIds) {
      try {
        await dependencies.deleteImage(publicId);
        console.log("Rolled back cat image:", publicId);
      } catch (cleanupError) {
        console.error(
          "Failed to roll back cat image:",
          publicId,
          cleanupError
        );
      }
    }

    return res.status(500).json({
      error: "Failed to create cat",
    });
  }
};

export const createCat = createCreateCatHandler({
  findDuplicate: findDuplicateName,
  createRecord: (args) => prisma.cats.create(args),
  uploadImage: uploadImageToCloudinary,
  deleteImage: deleteImageFromCloudinary,
});

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

export interface UpdateCatDependencies {
  findCat: typeof prisma.cats.findFirst;
  findDuplicate: typeof findDuplicateName;
  updateRecord: typeof prisma.cats.update;
  uploadImage: typeof uploadImageToCloudinary;
  deleteImage: typeof deleteImageFromCloudinary;
}

export const createUpdateCatHandler = (
  dependencies: UpdateCatDependencies
) => async (req: AuthRequest, res: Response) => {
  const uploadedPublicIds: string[] = [];

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
    const existingCat = await dependencies.findCat({
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
       * However, a normal cat cannot be manually renamed TO
       * "Unknown Cats".
       */
      if (isReservedName(name) && !isReservedName(existingCat.name)) {
        return res.status(400).json({
          error: `"${UNKNOWN_ALBUM_NAME}" is a reserved name`,
        });
      }

      const duplicateCat = await dependencies.findDuplicate(
        req.profileId,
        name,
        catId
      );

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
    // PROFILE IMAGE AND COVER IMAGE
    // ========================================================

    let profileImageUrl: string | undefined;
    let coverImageUrl: string | undefined;

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const profileImage = files?.profile_image?.[0];
    const coverImage = files?.cover_image?.[0];

    // Upload profile picture only if a new one was selected
    if (profileImage) {
      const uploadedImage = await dependencies.uploadImage(
        profileImage.buffer,
        `feeline/${req.profileId}`
      );

      profileImageUrl = uploadedImage.url;
      uploadedPublicIds.push(uploadedImage.publicId);
    }

    // Upload cover photo only if a new one was selected
    if (coverImage) {
      const uploadedImage = await dependencies.uploadImage(
        coverImage.buffer,
        `feeline/${req.profileId}`
      );

      coverImageUrl = uploadedImage.url;
      uploadedPublicIds.push(uploadedImage.publicId);
    }

    // ========================================================
    // UPDATE DATABASE
    // ========================================================

    const updatedCat = await dependencies.updateRecord({
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

        ...(coverImageUrl !== undefined
          ? {
              cover_image_url: coverImageUrl,
            }
          : {}),
      },
    });

    return res.json({
      cat: updatedCat,
    });
  } catch (error) {
    console.error("Update cat error:", error);

    for (const publicId of uploadedPublicIds) {
      try {
        await dependencies.deleteImage(publicId);
        console.log("Rolled back updated cat image:", publicId);
      } catch (cleanupError) {
        console.error(
          "Failed to roll back updated cat image:",
          publicId,
          cleanupError
        );
      }
    }

    return res.status(500).json({
      error: "Failed to update cat",
    });
  }
};

export const updateCat = createUpdateCatHandler({
  findCat: (args) => prisma.cats.findFirst(args),
  findDuplicate: findDuplicateName,
  updateRecord: (args) => prisma.cats.update(args),
  uploadImage: uploadImageToCloudinary,
  deleteImage: deleteImageFromCloudinary,
});

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
