
import prisma from "../config/db.config.js";

import {
  processAccountDeletionJob,
} from "./accountDeletion.service.js";

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_RETRIES = 5;
const BATCH_SIZE = 10;

const WORKER_INTERVAL_MS = 60 * 1000;
const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;
const RETRY_DELAY_MS = 2 * 60 * 1000;

// ============================================================
// DEPENDENCIES
// ============================================================

// The production worker uses Prisma and the real deletion
// service. Tests can provide fake implementations.

type DeletionJobReader = Pick<
  typeof prisma.account_deletion_jobs,
  "findMany"
>;

export interface AccountDeletionWorkerDependencies {
  jobs: DeletionJobReader;

  processJob: (
    jobId: string
  ) => Promise<boolean>;
}

const defaultDependencies: AccountDeletionWorkerDependencies = {
  jobs: prisma.account_deletion_jobs,
  processJob: processAccountDeletionJob,
};

// ============================================================
// WORKER STATE
// ============================================================

let isWorkerRunning = false;

let workerInterval:
  ReturnType<typeof setInterval> | null = null;

// ============================================================
// PROCESS PENDING ACCOUNT DELETION JOBS
// ============================================================

export async function processPendingDeletionJobs(
  dependencies: AccountDeletionWorkerDependencies =
    defaultDependencies
): Promise<void> {
  // Prevent overlapping worker scans within this process.
  if (isWorkerRunning) {
    return;
  }

  isWorkerRunning = true;

  try {
    const now = Date.now();

    const staleBefore = new Date(
      now - PROCESSING_TIMEOUT_MS
    );

    const retryBefore = new Date(
      now - RETRY_DELAY_MS
    );

    // ========================================================
    // 1. FIND ELIGIBLE DELETION JOBS
    // ========================================================

    const jobs = await dependencies.jobs.findMany({
      where: {
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

      orderBy: {
        created_at: "asc",
      },

      take: BATCH_SIZE,

      select: {
        job_id: true,
      },
    });

    if (jobs.length === 0) {
      return;
    }

    console.log(
      `[FeELINE] Processing ${jobs.length} account deletion job(s).`
    );

    // ========================================================
    // 2. PROCESS EACH ELIGIBLE JOB
    // ========================================================

    for (const job of jobs) {
      try {
        const completed =
          await dependencies.processJob(job.job_id);

        if (completed) {
          console.log(
            `[FeELINE] Account cleanup completed: ${job.job_id}`
          );
        } else {
          console.warn(
            `[FeELINE] Account cleanup not completed: ${job.job_id}`
          );
        }
      } catch (error) {
        // A failed job must not prevent subsequent jobs
        // from being processed.

        console.error(
          `[FeELINE] Account cleanup error: ${job.job_id}`,
          error
        );
      }
    }
  } catch (error) {
    console.error(
      "[FeELINE] Account deletion worker failed:",
      error
    );
  } finally {
    // Always release the worker lock, even after errors.
    isWorkerRunning = false;
  }
}

// ============================================================
// START WORKER
// ============================================================

export function startAccountDeletionWorker(
  dependencies: AccountDeletionWorkerDependencies =
    defaultDependencies
): void {
  // Prevent multiple intervals in one process.
  if (workerInterval) {
    return;
  }

  console.log(
    "[FeELINE] Account deletion worker initialized."
  );

  // Scan for eligible jobs immediately on startup.
  void processPendingDeletionJobs(dependencies);

  // Scan periodically for new and retryable jobs.
  workerInterval = setInterval(() => {
    void processPendingDeletionJobs(dependencies);
  }, WORKER_INTERVAL_MS);
}

// ============================================================
// STOP WORKER
// ============================================================

export function stopAccountDeletionWorker(): void {
  if (!workerInterval) {
    return;
  }

  clearInterval(workerInterval);
  workerInterval = null;

  console.log(
    "[FeELINE] Account deletion worker stopped."
  );
}
