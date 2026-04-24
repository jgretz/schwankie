CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "link_embedding" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"embedding" vector(768) NOT NULL,
	"model" varchar(100) NOT NULL,
	"computed_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "link_embedding" ADD CONSTRAINT "link_embedding_link_id_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."link"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_link_embedding_link_id" ON "link_embedding" ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_embedding_model" ON "link_embedding" ("model");