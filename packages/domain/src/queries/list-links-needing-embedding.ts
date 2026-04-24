import {link, linkEmbedding} from 'database';
import {and, inArray, isNotNull, sql} from 'drizzle-orm';
import {getDb} from '../db';

export type LinkForEmbedding = {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
};

export async function listLinksNeedingEmbedding(
  model: string,
  limit = 10,
): Promise<LinkForEmbedding[]> {
  const db = getDb();

  return db
    .select({
      id: link.id,
      title: link.title,
      description: link.description,
      content: link.content,
    })
    .from(link)
    .where(
      and(
        inArray(link.status, ['queued', 'saved']),
        isNotNull(link.content),
        sql`NOT EXISTS (
          SELECT 1 FROM ${linkEmbedding}
          WHERE ${linkEmbedding.linkId} = ${link.id}
            AND ${linkEmbedding.model} = ${model}
        )`,
      ),
    )
    .limit(limit);
}
