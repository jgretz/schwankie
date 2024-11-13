CREATE TABLE IF NOT EXISTS "feed_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"lastLoad" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feed_item" ADD COLUMN "feedId" serial NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feed_item" ADD CONSTRAINT "feed_item_feedId_feed_id_fk" FOREIGN KEY ("feedId") REFERENCES "public"."feed"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
