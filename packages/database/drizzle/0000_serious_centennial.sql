-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "link" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(2048) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" varchar(800),
	"image_url" varchar(2048),
	"create_date" timestamp(6) NOT NULL,
	"update_date" timestamp(6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"create_date" timestamp(6) NOT NULL,
	"update_date" timestamp(6) NOT NULL,
	"text" varchar(80) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "link_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"create_date" timestamp(6) NOT NULL,
	"update_date" timestamp(6) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "link_tag" ADD CONSTRAINT "link_tag_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "public"."link"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "link_tag" ADD CONSTRAINT "link_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/