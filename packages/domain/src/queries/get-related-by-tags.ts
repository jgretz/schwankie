import {link, linkTag, tag} from 'database';
import {and, eq, inArray, ne} from 'drizzle-orm';
import {getDb} from '../db';
import type {RelatedLink} from '../types';

export async function getRelatedByTags(linkId: number, limit = 10): Promise<RelatedLink[]> {
  const db = getDb();

  const srcTagRows = await db
    .select({tagId: linkTag.tagId})
    .from(linkTag)
    .where(eq(linkTag.linkId, linkId));
  const srcTagIds = srcTagRows.map((r) => r.tagId);
  if (srcTagIds.length === 0) return [];

  const overlapRows = await db
    .select({linkId: linkTag.linkId, tagId: linkTag.tagId})
    .from(linkTag)
    .innerJoin(link, eq(linkTag.linkId, link.id))
    .where(
      and(
        inArray(linkTag.tagId, srcTagIds),
        ne(linkTag.linkId, linkId),
        eq(link.status, 'saved'),
      ),
    );

  const overlapByLink = new Map<number, number>();
  for (const row of overlapRows) {
    overlapByLink.set(row.linkId, (overlapByLink.get(row.linkId) ?? 0) + 1);
  }

  const top = [...overlapByLink.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  if (top.length === 0) return [];

  const ids = top.map(([id]) => id);

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
  for (const [id, overlap] of top) {
    const row = linkById.get(id);
    if (!row) continue;
    results.push({
      ...row,
      tags: tagsByLink.get(id) ?? [],
      overlap,
      similarity: null,
    });
  }
  return results;
}
