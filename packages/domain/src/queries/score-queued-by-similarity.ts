import {link, linkEmbedding} from 'database';
import {and, eq, isNull, sql} from 'drizzle-orm';
import {getDb} from '../db';

export type QueueSimilarityScore = {linkId: number; score: number};

/**
 * For queued links with an embedding and no current score, compute a 0–100
 * score = round(mean of top-K cosine similarity to SAVED links with an
 * embedding, filtered by minSimilarity). Used by the score-links job.
 */
export async function scoreQueuedBySimilarity(
  limit = 100,
  k = 10,
  minSimilarity = 0.5,
): Promise<QueueSimilarityScore[]> {
  const db = getDb();

  // Only score queued links that both (a) have an embedding and (b) lack a score.
  const candidates = await db
    .select({linkId: linkEmbedding.linkId, embedding: linkEmbedding.embedding})
    .from(linkEmbedding)
    .innerJoin(link, eq(link.id, linkEmbedding.linkId))
    .where(and(eq(link.status, 'queued'), isNull(link.score)))
    .limit(limit);

  if (candidates.length === 0) return [];

  // Bail if there are no saved embeddings to compare against — score=null
  // means "try again next tick" rather than poisoning with a zero.
  const [savedCount] = await db
    .select({n: sql<number>`count(*)`})
    .from(linkEmbedding)
    .innerJoin(link, eq(link.id, linkEmbedding.linkId))
    .where(eq(link.status, 'saved'));
  if (!savedCount || Number(savedCount.n) === 0) return [];

  const results: QueueSimilarityScore[] = [];
  for (const c of candidates) {
    const vec = `[${c.embedding.join(',')}]`;
    const rows = await db.execute<{similarity: number}>(sql`
      SELECT (1 - (${linkEmbedding.embedding} <=> ${vec}::vector))::float8 as similarity
      FROM ${linkEmbedding}
      INNER JOIN ${link} ON ${link.id} = ${linkEmbedding.linkId}
      WHERE ${link.status} = 'saved'
        AND ${linkEmbedding.linkId} != ${c.linkId}
      ORDER BY ${linkEmbedding.embedding} <=> ${vec}::vector ASC
      LIMIT ${k}
    `);
    const sims = Array.from(rows as unknown as Array<{similarity: number}>)
      .map((r) => Number(r.similarity))
      .filter((s) => s >= minSimilarity);
    if (sims.length === 0) {
      results.push({linkId: c.linkId, score: 0});
      continue;
    }
    const mean = sims.reduce((a, b) => a + b, 0) / sims.length;
    results.push({linkId: c.linkId, score: Math.round(Math.max(0, Math.min(1, mean)) * 100)});
  }

  return results;
}
