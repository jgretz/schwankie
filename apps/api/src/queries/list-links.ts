import type {Database} from 'database';
import {link, tag, linkTag} from 'database';
import {eq, and, ilike, or, inArray, desc, sql, count} from 'drizzle-orm';

export type ListLinksParams = {
  limit: number;
  offset: number;
  status?: 'saved' | 'queued' | 'archived';
  tags?: string;
  q?: string;
};

type LinkWithTags = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  createDate: Date;
  updateDate: Date;
  tags: Array<{id: number; text: string}>;
};

export type ListLinksResult = {
  items: LinkWithTags[];
  hasMore: boolean;
  nextOffset: number;
  total: number;
};

export async function listLinks(db: Database, params: ListLinksParams): Promise<ListLinksResult> {
  const {limit, offset, status, tags: tagsParam, q} = params;

  const conditions = [];

  if (status) {
    conditions.push(eq(link.status, status));
  }

  if (q) {
    conditions.push(or(ilike(link.title, `%${q}%`), ilike(link.description, `%${q}%`)));
  }

  if (tagsParam) {
    const tagIds = tagsParam.split(',').map(Number).filter(Boolean);
    if (tagIds.length > 0) {
      // AND filter: link must have ALL specified tags
      const subquery = sql`(
        SELECT ${linkTag.linkId}
        FROM ${linkTag}
        WHERE ${inArray(linkTag.tagId, tagIds)}
        GROUP BY ${linkTag.linkId}
        HAVING COUNT(DISTINCT ${linkTag.tagId}) = ${tagIds.length}
      )`;
      conditions.push(sql`${link.id} IN ${subquery}`);
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
