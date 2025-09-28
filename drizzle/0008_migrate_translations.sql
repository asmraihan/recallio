-- First, add the new columns if they don't exist
ALTER TABLE "words" 
ADD COLUMN IF NOT EXISTS "translation_one" text,
ADD COLUMN IF NOT EXISTS "translation_two" text;

-- Copy data from old columns to new columns
UPDATE "words"
SET 
  "translation_one" = "english_translation",
  "translation_two" = "bangla_translation"
WHERE "translation_one" IS NULL;

-- Only after verifying data is copied, remove old columns
ALTER TABLE "words"
DROP COLUMN IF EXISTS "english_translation",
DROP COLUMN IF EXISTS "bangla_translation";