ALTER TABLE "user_words" ALTER COLUMN "original_word_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_words" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_words" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "user_words" DROP COLUMN "updated_at";