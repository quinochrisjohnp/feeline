-- Prevent multiple account deletion jobs for the same profile.
-- Historical jobs remain available after the profile is deleted.

CREATE UNIQUE INDEX IF NOT EXISTS
  account_deletion_jobs_profile_id_unique
ON account_deletion_jobs (profile_id);
