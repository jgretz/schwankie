DO $$ BEGIN
 CREATE TYPE "public"."link_status" AS ENUM('queued', 'saved', 'archived', 'trashed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "link_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"create_date" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "link" ADD COLUMN IF NOT EXISTS "status" "link_status" NOT NULL DEFAULT 'saved';
--> statement-breakpoint
ALTER TABLE "link" ADD COLUMN IF NOT EXISTS "content" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar(200) NOT NULL,
	"create_date" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"update_date" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tag_text_unique" UNIQUE("text")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "link_tag" ADD CONSTRAINT "link_tag_link_id_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."link"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "link_tag" ADD CONSTRAINT "link_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_tag_link_id" ON "link_tag" ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_tag_tag_id" ON "link_tag" ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_link_tag_unique" ON "link_tag" ("link_id","tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_status" ON "link" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_create_date" ON "link" ("create_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tag_text" ON "tag" ("text");