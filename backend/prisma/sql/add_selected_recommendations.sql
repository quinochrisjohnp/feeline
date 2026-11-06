ALTER TABLE "emotion_detections"
ADD COLUMN IF NOT EXISTS "selected_recommendations" JSONB;
