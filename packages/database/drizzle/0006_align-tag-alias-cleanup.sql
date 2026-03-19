ALTER TABLE "tag_alias" RENAME COLUMN "created_at" TO "create_date";--> statement-breakpoint
ALTER TABLE "tag" DROP CONSTRAINT "tag_text_unique";--> statement-breakpoint
ALTER TABLE "tag_alias" ALTER COLUMN "create_date" SET DATA TYPE timestamp (6) with time zone;
