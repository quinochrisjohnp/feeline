
CREATE TABLE IF NOT EXISTS account_deletion_jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL,

    cloudinary_public_ids JSONB NOT NULL
        DEFAULT '[]'::jsonb,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    retry_count INTEGER NOT NULL DEFAULT 0,

    last_error TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ,

    CONSTRAINT account_deletion_jobs_status_check
        CHECK (
            status IN (
                'pending',
                'processing',
                'completed',
                'failed'
            )
        ),

    CONSTRAINT account_deletion_jobs_retry_count_check
        CHECK (retry_count >= 0)
);
