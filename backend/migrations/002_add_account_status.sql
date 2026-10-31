
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20)
NOT NULL DEFAULT 'active';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_account_status_check'
          AND conrelid = 'profiles'::regclass
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT profiles_account_status_check
        CHECK (account_status IN ('active', 'deleting'));
    END IF;
END
$$;
