CREATE TABLE IF NOT EXISTS "promote_failure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"source_item_id" text NOT NULL,
	"url" text,
	"title" text,
	"error_message" text NOT NULL,
	"error_code" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promote_failure_source_created_at" ON "promote_failure" ("source","created_at");