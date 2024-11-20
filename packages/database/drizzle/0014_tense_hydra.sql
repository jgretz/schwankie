CREATE TABLE IF NOT EXISTS "feed_import_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"feed_id" serial NOT NULL,
	"import_date" timestamp (6) NOT NULL,
	"item_count" integer NOT NULL
);
--> statement-breakpoint
DROP TABLE "feed_stats";--> statement-breakpoint
ALTER TABLE "feed" RENAME COLUMN "feedUrl" TO "feed_url";--> statement-breakpoint
ALTER TABLE "feed" RENAME COLUMN "siteUrl" TO "site_url";--> statement-breakpoint
ALTER TABLE "feed_item" RENAME COLUMN "feedId" TO "feed_id";--> statement-breakpoint
ALTER TABLE "feed_item" DROP CONSTRAINT "feed_item_feedId_feed_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "existing_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_import_history" ADD CONSTRAINT "feed_import_history_feed_id_feed_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feed"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_item" ADD CONSTRAINT "feed_item_feed_id_feed_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feed"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "existing_idx" ON "feed_item" USING btree ("feed_id","guid");