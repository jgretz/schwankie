CREATE TABLE IF NOT EXISTS "work_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp (6) with time zone,
	"completed_at" timestamp (6) with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_work_request_status_created_at" ON "work_request" ("status","created_at");