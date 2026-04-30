import {link, linkEmbedding} from 'database';
import {and, asc, inArray, isNotNull, lt, sql} from 'drizzle-orm';
import {getDb} from '../db';

export const EMBEDDING_FAIL_LIMIT = 3;

export type LinkForEmbedding = {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  embeddingFailCount: number;
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
      embeddingFailCount: link.embeddingFailCount,
    })
    .from(link)
    .where(
      and(
        inArray(link.status, ['queued', 'saved']),
        isNotNull(link.content),
        lt(link.embeddingFailCount, EMBEDDING_FAIL_LIMIT),
        sql`NOT EXISTS (
          SELECT 1 FROM ${linkEmbedding}
          WHERE ${linkEmbedding.linkId} = ${link.id}
            AND ${linkEmbedding.model} = ${model}
        )`,
      ),
    )
    .orderBy(asc(link.id))
    .limit(limit);
}
