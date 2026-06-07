-- HNSW index for cosine distance (<=>) on link embeddings.
-- Backs scoreQueuedBySimilarity (score-links job) and getRelatedByVector
-- (related-links page), replacing full sequential vector scans with index
-- lookups. Cuts Neon compute on the heaviest query pattern.
CREATE INDEX IF NOT EXISTS "idx_link_embedding_hnsw"
  ON "link_embedding"
  USING hnsw ("embedding" vector_cosine_ops);
