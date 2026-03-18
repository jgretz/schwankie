import {link, linkStatusEnum, linkTag, tag} from 'database';
import {count, desc, eq, gte, sql} from 'drizzle-orm';
import {getDb} from '../db';

export type LinkStatus = (typeof linkStatusEnum.enumValues)[number];

export async function getTagsWithCount(status?: LinkStatus, minCount?: number) {
  const db = getDb();

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

  let countedQuery = query.groupBy(tag.id, tag.text);

  if (minCount !== undefined && minCount > 1) {
    countedQuery = countedQuery.having(
      gte(count(sql`DISTINCT ${linkTag.linkId}`), minCount)
    );
  }

  return countedQuery.orderBy(
    desc(sql`count(DISTINCT ${linkTag.linkId})`),
    tag.text
  );
}
