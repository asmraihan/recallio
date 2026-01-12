ALTER TABLE "users" ADD COLUMN "main_language" text DEFAULT 'German' NOT NULL;
ALTER TABLE "users" ADD COLUMN "translation_languages" jsonb DEFAULT '["English", "Bangla"]';
