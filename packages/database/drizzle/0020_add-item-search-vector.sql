-- Stored full-text vectors + GIN indexes for history search.
--
-- searchHistoryCandidates computed these vectors per query over the whole
-- time window; on ~95k rss rows that took 4.6-6.8s and pushed the request
-- past Bun's 10s idle timeout. Stored, the match is an index lookup and
-- ts_rank reads the column instead of re-parsing content.
--
-- Custom migration because the pinned toolchain cannot express it:
-- drizzle-orm 0.30 has no generatedAlwaysAs and drizzle-kit 0.21 only emits
-- btree indexes (same situation as 0013's HNSW index). The columns are
-- deliberately absent from the drizzle schema: they are read through raw SQL
-- in packages/domain/src/lib/history-candidates.ts, whose weighting and
-- 2000-char content cap must stay identical to these expressions.
--
-- Adding a STORED generated column rewrites the table under an exclusive
-- lock; for rss_item (~260 MB) expect that lock to last a short while.
ALTER TABLE "rss_item" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("title", '')), 'A')
  || setweight(to_tsvector('english', coalesce("summary", '')), 'B')
  || setweight(to_tsvector('english', left(coalesce("content", ''), 2000)), 'C')
) STORED;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rss_item_search_vector"
  ON "rss_item" USING gin ("search_vector");--> statement-breakpoint
ALTER TABLE "email_item" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("title", '')), 'A')
  || setweight(to_tsvector('english', coalesce("email_subject", '')), 'A')
  || setweight(to_tsvector('english', coalesce("description", '')), 'B')
) STORED;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_item_search_vector"
  ON "email_item" USING gin ("search_vector");
