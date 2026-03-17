DROP INDEX IF EXISTS "idx_link_status";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_link_create_date";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_status_create_date" ON "link" ("status","create_date");