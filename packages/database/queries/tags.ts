import {count, desc, eq, sql} from 'drizzle-orm';

import type {Database} from '../index';
import {link, linkStatusEnum, linkTag, tag} from '../schema';

export type LinkStatus = (typeof linkStatusEnum.enumValues)[number];

export async function getTagsWithCount(db: Database, status?: LinkStatus) {
  let query = db
    .select({
      id: tag.id,
      text: tag.text,
      count: count(sql`DISTINCT ${linkTag.linkId}`).as('count'),
    })
    .from(tag)
    .innerJoin(linkTag, eq(tag.id, linkTag.tagId))
    .innerJoin(link, eq(linkTag.linkId, link.id))
    .$dynamic();

  if (status) {
    query = query.where(eq(link.status, status));
  }

  return query
    .groupBy(tag.id, tag.text)
    .orderBy(desc(sql`count(DISTINCT ${linkTag.linkId})`), tag.text);
}
