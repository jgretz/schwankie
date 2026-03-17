import {link, tag, linkTag} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';
import type {LinkWithTags} from '../types';

export async function getLink(id: number): Promise<LinkWithTags | null> {
  const db = getDb();

  const [row] = await db.select().from(link).where(eq(link.id, id)).limit(1);
  if (!row) return null;

  const tags = await db
    .select({id: tag.id, text: tag.text})
    .from(linkTag)
    .innerJoin(tag, eq(linkTag.tagId, tag.id))
    .where(eq(linkTag.linkId, id));

  return {...row, tags};
}
