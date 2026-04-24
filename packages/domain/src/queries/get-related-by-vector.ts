import {link, linkEmbedding, linkTag, tag} from 'database';
import {eq, inArray, sql} from 'drizzle-orm';
import {getDb} from '../db';
import type {RelatedLink} from '../types';

export async function getRelatedByVector(
  linkId: number,
  limit = 10,
  minSimilarity = 0.5,
): Promise<RelatedLink[]> {
  const db = getDb();

  const [source] = await db
    .select({embedding: linkEmbedding.embedding})
    .from(linkEmbedding)
    .where(eq(linkEmbedding.linkId, linkId))
    .limit(1);
  if (!source) return [];

  const sourceVec = `[${source.embedding.join(',')}]`;

  const rows = await db.execute<{
    link_id: number;
    similarity: number;
  }>(sql`
    SELECT ${linkEmbedding.linkId} as link_id,
           (1 - (${linkEmbedding.embedding} <=> ${sourceVec}::vector))::float8 as similarity
    FROM ${linkEmbedding}
    INNER JOIN ${link} ON ${link.id} = ${linkEmbedding.linkId}
    WHERE ${linkEmbedding.linkId} != ${linkId}
      AND ${link.status} = 'saved'
      AND (1 - (${linkEmbedding.embedding} <=> ${sourceVec}::vector)) >= ${minSimilarity}
    ORDER BY ${linkEmbedding.embedding} <=> ${sourceVec}::vector ASC
    LIMIT ${limit}
  `);

  const rowArr = Array.from(rows as unknown as Array<{link_id: number; similarity: number}>);
  if (rowArr.length === 0) return [];

  const ids = rowArr.map((r) => r.link_id);
  const simById = new Map(rowArr.map((r) => [r.link_id, r.similarity]));

  const [linkRows, tagJoinRows] = await Promise.all([
    db.select().from(link).where(inArray(link.id, ids)),
    db
      .select({linkId: linkTag.linkId, tagId: tag.id, tagText: tag.text})
      .from(linkTag)
      .innerJoin(tag, eq(linkTag.tagId, tag.id))
      .where(inArray(linkTag.linkId, ids)),
  ]);

  const tagsByLink = new Map<number, Array<{id: number; text: string}>>();
  for (const row of tagJoinRows) {
    const existing = tagsByLink.get(row.linkId) ?? [];
    existing.push({id: row.tagId, text: row.tagText});
    tagsByLink.set(row.linkId, existing);
  }

  const linkById = new Map(linkRows.map((l) => [l.id, l]));
  const results: RelatedLink[] = [];
  for (const id of ids) {
    const row = linkById.get(id);
    if (!row) continue;
    results.push({
      ...row,
      tags: tagsByLink.get(id) ?? [],
      overlap: null,
      similarity: simById.get(id) ?? null,
    });
  }
  return results;
}
