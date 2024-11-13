ALTER TABLE "feed_stats" RENAME COLUMN "lastLoad" TO "last_load";--> statement-breakpoint
ALTER TABLE "feed_stats" ALTER COLUMN "last_load" SET DATA TYPE timestamp(6);