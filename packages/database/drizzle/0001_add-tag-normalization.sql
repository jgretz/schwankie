CREATE TABLE IF NOT EXISTS "tag_alias" (
	"id" serial PRIMARY KEY NOT NULL,
	"alias_text" varchar(200) NOT NULL,
	"canonical_tag_id" integer NOT NULL,
	"source" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tag" ADD COLUMN "normalized_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tag_alias" ADD CONSTRAINT "tag_alias_canonical_tag_id_tag_id_fk" FOREIGN KEY ("canonical_tag_id") REFERENCES "public"."tag"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tag_alias_canonical" ON "tag_alias" ("canonical_tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tag_alias_source" ON "tag_alias" ("source");

