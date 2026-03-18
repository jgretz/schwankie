ALTER TABLE "link" ADD COLUMN "score" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_link_score" ON "link" ("score");