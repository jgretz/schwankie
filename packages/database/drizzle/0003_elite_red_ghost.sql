ALTER TABLE "feed_item" RENAME COLUMN "rss_guid" TO "guid";--> statement-breakpoint
ALTER TABLE "feed_item" ADD COLUMN "content" json DEFAULT '';