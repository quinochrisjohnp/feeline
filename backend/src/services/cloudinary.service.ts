
import prisma from "../config/db.config.js";
import cloudinary from "../config/cloudinary.config.js";

import {
  getLegacyCloudinaryPublicId,
} from "../utils/cloudinaryPublicId.js";

// ============================================================
// TYPES
// ============================================================

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

// ============================================================
// UPLOAD IMAGE TO CLOUDINARY
// ============================================================

export const uploadImageToCloudinary = (
  fileBuffer: Buffer,
  folder: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            {
              width: 1000,
              crop: "limit",
            },
            {
              quality: "auto:good",
            },
            {
              fetch_format: "auto",
            },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              error ??
                new Error("Cloudinary upload failed")
            );
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

    uploadStream.end(fileBuffer);
  });
};

// ============================================================
// DELETE A SINGLE CLOUDINARY IMAGE
// ============================================================

// Used when image upload succeeds but the following
// database operation fails.


export const deleteImageFromCloudinary = async (
  publicId: string,
  destroy: (
    id: string,
    options: { resource_type: "image" }
  ) => Promise<{ result?: string }> = (id, options) =>
    cloudinary.uploader.destroy(id, options)
): Promise<void> => {
  if (!publicId || !publicId.trim()) {
    throw new Error("Cloudinary public ID is required");
  }

  const result = await destroy(publicId, {
    resource_type: "image",
  });

  if (result?.result !== "ok" && result?.result !== "not found") {
    throw new Error(
      `Cloudinary deletion was not confirmed: ${String(result?.result ?? "unknown")}`
    );
  }
};


// ============================================================
// DISCOVER CLOUDINARY IMAGES OWNED BY A FEELINE ACCOUNT
// ============================================================

export interface CloudinaryDiscoveryDependencies {
  cloudinaryApi: Pick<
    typeof cloudinary.api,
    "resources"
  >;
  database: Pick<
    typeof prisma,
    "profiles" | "cats" | "cat_images"
  >;
}

export const getAccountCloudinaryImageIds = async (
  profileId: string,
  dependencies: CloudinaryDiscoveryDependencies = {
    cloudinaryApi: cloudinary.api,
    database: prisma,
  }
): Promise<string[]> => {
  const accountFolder = `feeline/${profileId}/`;
  const publicIds = new Set<string>();

  // ==========================================================
  // 1. COLLECT ACCOUNT-SPECIFIC CLOUDINARY IMAGES
  // ==========================================================

  let nextCursor: string | undefined;

  do {
    const response = await dependencies.cloudinaryApi.resources({
      type: "upload",
      resource_type: "image",
      prefix: accountFolder,
      max_results: 500,
      ...(nextCursor
        ? { next_cursor: nextCursor }
        : {}),
    });

    for (const resource of response.resources ?? []) {
      if (
        typeof resource.public_id === "string" &&
        resource.public_id.startsWith(accountFolder)
      ) {
        publicIds.add(resource.public_id);
      }
    }

    nextCursor = response.next_cursor;
  } while (nextCursor);

  // ==========================================================
  // 2. FIND IMAGES REFERENCED BY THE ACCOUNT
  // ==========================================================

  const profile = await dependencies.database.profiles.findUnique({
    where: {
      profile_id: profileId,
    },
    select: {
      cats: {
        select: {
          profile_image_url: true,
          cover_image_url: true,
          cat_images: {
            select: {
              image_url: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    throw new Error(
      "Account not found during Cloudinary image discovery."
    );
  }

  const ownedUrls = new Set<string>();

  for (const cat of profile.cats) {
    if (cat.profile_image_url) {
      ownedUrls.add(cat.profile_image_url);
    }

    if (cat.cover_image_url) {
      ownedUrls.add(cat.cover_image_url);
    }

    for (const image of cat.cat_images) {
      ownedUrls.add(image.image_url);
    }
  }

  // ==========================================================
  // 3. EXTRACT CANONICAL LEGACY CLOUDINARY PUBLIC IDS
  // ==========================================================

  const legacyIds = new Set<string>();

  for (const imageUrl of ownedUrls) {
    const publicId = getLegacyCloudinaryPublicId(
      imageUrl
    );

    if (publicId) {
      legacyIds.add(publicId);
    }
  }

  if (legacyIds.size === 0) {
    return [...publicIds];
  }

  // ==========================================================
  // 4. COLLECT REFERENCES FROM OTHER ACCOUNTS
  // ==========================================================

  // Cloudinary URLs may have different versions or
  // transformations while referring to the same resource.
  // Compare parsed public IDs rather than exact URLs.

  const [
    otherAlbumImages,
    otherCats,
    otherProfiles,
  ] = await Promise.all([
    dependencies.database.cat_images.findMany({
      where: {
        cats: {
          profile_id: {
            not: profileId,
          },
        },
        image_url: {
          contains: "feeline/cats/",
        },
      },
      select: {
        image_url: true,
      },
    }),

    dependencies.database.cats.findMany({
      where: {
        profile_id: {
          not: profileId,
        },
        OR: [
          {
            profile_image_url: {
              contains: "feeline/cats/",
            },
          },
          {
            cover_image_url: {
              contains: "feeline/cats/",
            },
          },
        ],
      },
      select: {
        profile_image_url: true,
        cover_image_url: true,
      },
    }),

    dependencies.database.profiles.findMany({
      where: {
        profile_id: {
          not: profileId,
        },
        profile_image_url: {
          contains: "feeline/cats/",
        },
      },
      select: {
        profile_image_url: true,
      },
    }),
  ]);

  // ==========================================================
  // 5. BUILD PUBLIC IDS REFERENCED BY OTHER ACCOUNTS
  // ==========================================================

  const otherUserIds = new Set<string>();

  const addOtherReference = (
    imageUrl: string | null
  ): void => {
    if (!imageUrl) {
      return;
    }

    const publicId = getLegacyCloudinaryPublicId(
      imageUrl
    );

    if (publicId) {
      otherUserIds.add(publicId);
    }
  };

  for (const image of otherAlbumImages) {
    addOtherReference(image.image_url);
  }

  for (const cat of otherCats) {
    addOtherReference(cat.profile_image_url);
    addOtherReference(cat.cover_image_url);
  }

  for (const otherProfile of otherProfiles) {
    addOtherReference(
      otherProfile.profile_image_url
    );
  }

  // ==========================================================
  // 6. PREVENT DELETING SHARED LEGACY IMAGES
  // ==========================================================

  for (const publicId of legacyIds) {
    if (otherUserIds.has(publicId)) {
      throw new Error(
        "Cloudinary image is shared with another account."
      );
    }

    publicIds.add(publicId);
  }

  // ==========================================================
  // 7. RETURN UNIQUE CLOUDINARY PUBLIC IDS
  // ==========================================================

  return [...publicIds];
};
