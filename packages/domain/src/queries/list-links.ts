import {link, tag, linkTag} from 'database';
import {eq, and, ilike, or, inArray, desc, sql, count, isNull, ne, gte, lt} from 'drizzle-orm';
import {getDb} from '../db';
import type {ListLinksParams, ListLinksResult} from '../types';

export async function listLinks(params: ListLinksParams): Promise<ListLinksResult> {
  const db = getDb();
  const {
    limit,
    offset,
    status,
    tags: tagsParam,
    q,
    ids,
    needs_enrichment,
    dead_enrichment,
  } = params;

  const conditions = [];

  if (needs_enrichment) {
    conditions.push(isNull(link.content));
    conditions.push(ne(link.status, 'trashed'));
    conditions.push(lt(link.enrichmentFailCount, 3));
  }

  if (dead_enrichment) {
    conditions.push(gte(link.enrichmentFailCount, 3));
  }

  if (status) {
    conditions.push(eq(link.status, status));
  }

  if (q) {
    conditions.push(or(ilike(link.title, `%${q}%`), ilike(link.description, `%${q}%`)));
  }

  if (tagsParam) {
    const tagTexts = tagsParam.split(',').filter(Boolean);
    if (tagTexts.length > 0) {
      const subquery = sql`(
        SELECT ${linkTag.linkId}
        FROM ${linkTag}
        INNER JOIN ${tag} ON ${tag.id} = ${linkTag.tagId}
        WHERE ${inArray(tag.text, tagTexts)}
        GROUP BY ${linkTag.linkId}
        HAVING COUNT(DISTINCT ${linkTag.tagId}) = ${tagTexts.length}
      )`;
      conditions.push(sql`${link.id} IN ${subquery}`);
    }
  }

  if (ids) {
    const idList = ids.split(',').map(Number).filter(Boolean);
    if (idList.length > 0) {
      conditions.push(inArray(link.id, idList));
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db.select().from(link).where(where).orderBy(desc(link.createDate)).limit(limit).offset(offset),
    db.select({count: count()}).from(link).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  const linkIds = items.map((l) => l.id);
  const tagRows =
    linkIds.length > 0
      ? await db
          .select({
            linkId: linkTag.linkId,
            tagId: tag.id,
            tagText: tag.text,
          })
          .from(linkTag)
          .innerJoin(tag, eq(linkTag.tagId, tag.id))
          .where(inArray(linkTag.linkId, linkIds))
      : [];

  const tagsByLink = new Map<number, Array<{id: number; text: string}>>();
  for (const row of tagRows) {
    const existing = tagsByLink.get(row.linkId) ?? [];
    existing.push({id: row.tagId, text: row.tagText});
    tagsByLink.set(row.linkId, existing);
  }

  const itemsWithTags = items.map((item) => ({
    ...item,
    tags: tagsByLink.get(item.id) ?? [],
  }));

  return {
    items: itemsWithTags,
    hasMore: offset + limit < total,
    nextOffset: Math.min(offset + limit, total),
    total,
  };
}
