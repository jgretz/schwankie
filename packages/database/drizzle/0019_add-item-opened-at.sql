ALTER TABLE "email_item" ADD COLUMN "opened_at" timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "rss_item" ADD COLUMN "opened_at" timestamp with time zone;