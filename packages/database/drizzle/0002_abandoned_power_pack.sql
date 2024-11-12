CREATE TABLE IF NOT EXISTS "feed" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"feedUrl" varchar(2048) NOT NULL,
	"siteUrl" varchar(2048) NOT NULL,
	"create_date" timestamp(6) NOT NULL,
	"update_date" timestamp(6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feed_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"rss_guid" varchar(500) NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"create_date" timestamp(6) NOT NULL,
	"update_date" timestamp(6) NOT NULL
);
