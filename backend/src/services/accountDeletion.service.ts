
import prisma from "../config/db.config.js";
import cloudinary from "../config/cloudinary.config.js";
import { getLegacyCloudinaryPublicId } from "../utils/cloudinaryPublicId.js";

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_RETRIES = 5;
const BATCH_SIZE = 100;
const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;
const RETRY_DELAY_MS = 2 * 60 * 1000;

// ============================================================
// DEPENDENCIES
// ============================================================

type DeletionJobs = Pick<
  typeof prisma.account_deletion_jobs,
  "updateMany" | "findUnique"
>;

export interface AccountDeletionDependencies {
  jobs: DeletionJobs;

  validateLegacyOwnership: (
    profileId: string,
    publicIds: string[]
  ) => Promise<void>;

  deleteResources: (
    publicIds: string[]
  ) => Promise<{
    deleted?: Record<string, string>;
  }>;
}

// ============================================================
// LEGACY IMAGE OWNERSHIP VALIDATION
// ============================================================

type LegacyOwnershipDatabase = Pick<
  typeof prisma,
  "cat_images" | "cats" | "profiles"
>;

export async function validateLegacyImageOwnership(
  profileId: string,
  publicIds: string[],
  database: LegacyOwnershipDatabase = prisma
): Promise<void> {
  const legacyIds = new Set(
    publicIds.filter((id) =>
      /^feeline\/cats\/[A-Za-z0-9_/-]+$/.test(id)
    )
  );

  if (legacyIds.size === 0) {
    return;
  }

  // Read all potentially relevant image references.
  // Do not rely on URL substring matching because
  // transformed Cloudinary URLs may have different paths.

  const [albumImages, cats, profiles] = await Promise.all([
    database.cat_images.findMany({
      where: {
        cats: {
          profile_id: {
            not: profileId,
          },
        },
      },
      select: {
        image_url: true,
      },
    }),

    database.cats.findMany({
      where: {
        profile_id: {
          not: profileId,
        },
      },
      select: {
        profile_image_url: true,
        cover_image_url: true,
      },
    }),

    database.profiles.findMany({
      where: {
        profile_id: {
          not: profileId,
        },
      },
      select: {
        profile_image_url: true,
      },
    }),
  ]);

  const checkReference = (
    imageUrl: string | null
  ): void => {
    if (!imageUrl) {
      return;
    }

    const referencedId =
      getLegacyCloudinaryPublicId(imageUrl);

    if (referencedId && legacyIds.has(referencedId)) {
      throw new Error(
        "Cloudinary legacy image is shared with another account."
      );
    }
  };

  for (const image of albumImages) {
    checkReference(image.image_url);
  }

  for (const cat of cats) {
    checkReference(cat.profile_image_url);
    checkReference(cat.cover_image_url);
  }

  for (const profile of profiles) {
    checkReference(profile.profile_image_url);
  }
}

// ============================================================
// PRODUCTION DEPENDENCIES
// ============================================================

const defaultDependencies: AccountDeletionDependencies = {
  jobs: prisma.account_deletion_jobs,

  validateLegacyOwnership: validateLegacyImageOwnership,

  deleteResources: async (publicIds) => {
    const result = await cloudinary.api.delete_resources(
      publicIds,
      {
        resource_type: "image",
        type: "upload",
      }
    );

    return {
      deleted: result.deleted,
    };
  },
};

// ============================================================
// PROCESS ACCOUNT DELETION JOB
// ============================================================

export async function processAccountDeletionJob(
  jobId: string,
  dependencies: AccountDeletionDependencies = defaultDependencies
): Promise<boolean> {
  const now = new Date();

  const staleBefore = new Date(
    now.getTime() - PROCESSING_TIMEOUT_MS
  );

  const retryBefore = new Date(
    now.getTime() - RETRY_DELAY_MS
  );

  const {
    jobs,
    validateLegacyOwnership,
    deleteResources,
  } = dependencies;

  // ==========================================================
  // 1. ATOMICALLY CLAIM THE JOB
  // ==========================================================

  const claimed = await jobs.updateMany({
    where: {
      job_id: jobId,
      retry_count: {
        lt: MAX_RETRIES,
      },
      OR: [
        {
          status: "pending",
        },
        {
          status: "failed",
          updated_at: {
            lte: retryBefore,
          },
        },
        {
          status: "processing",
          updated_at: {
            lt: staleBefore,
          },
        },
      ],
    },
    data: {
      status: "processing",
      retry_count: {
        increment: 1,
      },
      updated_at: now,
      last_error: null,
    },
  });

  if (claimed.count !== 1) {
    const existingJob = await jobs.findUnique({
      where: {
        job_id: jobId,
      },
      select: {
        status: true,
      },
    });

    return existingJob?.status === "completed";
  }

  // ==========================================================
  // 2. READ THE CLAIMED JOB
  // ==========================================================

  const job = await jobs.findUnique({
    where: {
      job_id: jobId,
    },
  });

  if (!job) {
    throw new Error("Account deletion job not found.");
  }

  const attemptNumber = job.retry_count;

  try {
    // ========================================================
    // 3. VALIDATE CLOUDINARY IMAGE IDS
    // ========================================================

    const rawIds = job.cloudinary_public_ids;

    if (
      !Array.isArray(rawIds) ||
      !rawIds.every(
        (id): id is string => typeof id === "string"
      )
    ) {
      throw new Error(
        "Invalid Cloudinary cleanup data."
      );
    }

    const accountFolderPrefix =
      `feeline/${job.profile_id}/`;

    const hasInvalidIds = rawIds.some((id) => {
      const isAccountImage =
        id.startsWith(accountFolderPrefix) &&
        /^feeline\/[A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+$/.test(id);

      const isLegacyImage =
        /^feeline\/cats\/[A-Za-z0-9_/-]+$/.test(id);

      return !isAccountImage && !isLegacyImage;
    });

    if (hasInvalidIds) {
      throw new Error(
        "Cloudinary cleanup contains invalid resource IDs."
      );
    }

    const publicIds = [...new Set(rawIds)];

    // ========================================================
    // 4. VERIFY LEGACY IMAGE OWNERSHIP
    // ========================================================

    // Refuse cleanup if another account currently
    // references any legacy image in this job.
    await validateLegacyOwnership(
      job.profile_id,
      publicIds
    );

    // ========================================================
    // 5. DELETE CLOUDINARY IMAGES
    // ========================================================

    for (
      let index = 0;
      index < publicIds.length;
      index += BATCH_SIZE
    ) {
      const batch = publicIds.slice(
        index,
        index + BATCH_SIZE
      );

      const result = await deleteResources(batch);

      for (const publicId of batch) {
        const status = result.deleted?.[publicId];

        if (
          status !== "deleted" &&
          status !== "not_found"
        ) {
          throw new Error(
            "Some Cloudinary images could not be deleted."
          );
        }
      }
    }

    // ========================================================
    // 6. MARK JOB COMPLETED
    // ========================================================

    const completed = await jobs.updateMany({
      where: {
        job_id: jobId,
        status: "processing",
        retry_count: attemptNumber,
      },
      data: {
        status: "completed",
        completed_at: new Date(),
        updated_at: new Date(),
        last_error: null,
      },
    });

    return completed.count === 1;

  } catch (error) {
    // ========================================================
    // 7. HANDLE CLEANUP FAILURE
    // ========================================================

    const message =
      error instanceof Error
        ? error.message
        : "Unknown Cloudinary cleanup error";

    const failed = await jobs.updateMany({
      where: {
        job_id: jobId,
        status: "processing",
        retry_count: attemptNumber,
      },
      data: {
        status: "failed",
        last_error: message,
        updated_at: new Date(),
      },
    });

    if (failed.count === 1) {
      console.error(
        `[FeELINE] Account cleanup failed: ${jobId}`,
        message
      );
    }

    return false;
  }
}
