ALTER TABLE "link" ADD COLUMN "enrichment_fail_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "link" ADD COLUMN "enrichment_last_error" varchar(500);