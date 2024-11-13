ALTER TABLE "feed_item" ALTER COLUMN "content" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "feed_item" ALTER COLUMN "content" SET NOT NULL;