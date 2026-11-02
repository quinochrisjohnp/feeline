-- Apply before deploying the admin review-status API.
ALTER TABLE feedback ADD COLUMN review_status varchar(16) NOT NULL DEFAULT 'New'
  CHECK (review_status IN ('New', 'In review', 'Resolved'));
