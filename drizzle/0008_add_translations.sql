-- Add new columns only
ALTER TABLE "words" 
ADD COLUMN IF NOT EXISTS "translation_one" text,
ADD COLUMN IF NOT EXISTS "translation_two" text;