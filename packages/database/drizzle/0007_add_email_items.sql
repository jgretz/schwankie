CREATE TABLE IF NOT EXISTS "email_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_message_id" text NOT NULL,
	"email_from" text NOT NULL,
	"link" text NOT NULL,
	"title" text,
	"description" text,
	"read" boolean DEFAULT false NOT NULL,
	"clicked" boolean DEFAULT false NOT NULL,
	"imported_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_item_message_link_unique" ON "email_item" ("email_message_id","link");