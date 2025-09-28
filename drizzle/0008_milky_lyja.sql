ALTER TABLE "words" ADD COLUMN "translation_one" text;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "translation_two" text;--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "english_translation";--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "bangla_translation";