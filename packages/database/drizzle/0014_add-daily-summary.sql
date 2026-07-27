CREATE TABLE IF NOT EXISTS "daily_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summary_date" date NOT NULL,
	"lookback_hours" integer NOT NULL,
	"window_start" timestamp (6) with time zone NOT NULL,
	"window_end" timestamp (6) with time zone NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"notable" text,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_daily_summary_summary_date" ON "daily_summary" ("summary_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_item_imported_at" ON "email_item" ("imported_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rss_item_created_at" ON "rss_item" ("created_at");