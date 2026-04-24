import {link, linkTag, tag} from 'database';
import {and, eq, inArray, ne} from 'drizzle-orm';
import {getDb} from '../db';

export type TagNeighbor = {id: number; text: string; count: number};

export async function getTagNeighborhood(tagId: number, limit = 20): Promise<TagNeighbor[]> {
  const db = getDb();

  const sharedLinkRows = await db
    .select({linkId: linkTag.linkId})
    .from(linkTag)
    .innerJoin(link, eq(linkTag.linkId, link.id))
    .where(and(eq(linkTag.tagId, tagId), eq(link.status, 'saved')));

  const linkIds = sharedLinkRows.map((r) => r.linkId);
  if (linkIds.length === 0) return [];

  const tagRows = await db
    .select({tagId: linkTag.tagId, tagText: tag.text})
    .from(linkTag)
    .innerJoin(tag, eq(linkTag.tagId, tag.id))
    .where(and(inArray(linkTag.linkId, linkIds), ne(linkTag.tagId, tagId)));

  const counts = new Map<number, {text: string; count: number}>();
  for (const row of tagRows) {
    const existing = counts.get(row.tagId);
    if (existing) existing.count += 1;
    else counts.set(row.tagId, {text: row.tagText, count: 1});
  }

  return [...counts.entries()]
    .map(([id, {text, count}]) => ({id, text, count}))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
    .slice(0, limit);
}
