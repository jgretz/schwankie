CREATE TABLE IF NOT EXISTS "feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"source_url" text NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"error_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_source_url_unique" UNIQUE("source_url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rss_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_id" uuid NOT NULL,
	"guid" text NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"summary" text,
	"content" text,
	"image_url" text,
	"published_at" timestamp with time zone,
	"read" boolean DEFAULT false NOT NULL,
	"clicked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rss_item" ADD CONSTRAINT "rss_item_feed_id_feed_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feed"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_feed_disabled_created_at" ON "feed" ("disabled","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_rss_item_feed_guid" ON "rss_item" ("feed_id","guid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rss_item_read_published" ON "rss_item" ("read","published_at");