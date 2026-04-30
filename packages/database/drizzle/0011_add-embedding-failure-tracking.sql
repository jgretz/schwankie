ALTER TABLE "link" ADD COLUMN "embedding_fail_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "link" ADD COLUMN "embedding_last_error" varchar(500);