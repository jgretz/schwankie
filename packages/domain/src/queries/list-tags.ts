import {tag} from 'database';
import {isNull, isNotNull, desc} from 'drizzle-orm';
import {getDb} from '../db';
import type {ListTagsParams, ListTagsResult} from '../types';
import {getTagsWithCount} from './get-tags-with-count';

export async function listTags(params: ListTagsParams): Promise<ListTagsResult> {
  const db = getDb();

  if (params.needs_normalization) {
    const tags = await db
      .select({id: tag.id, text: tag.text})
      .from(tag)
      .where(isNull(tag.normalizedAt));
    return {tags};
  }

  if (params.canonical) {
    let query = db
      .select({id: tag.id, text: tag.text})
      .from(tag)
      .where(isNotNull(tag.normalizedAt))
      .orderBy(desc(tag.normalizedAt))
      .$dynamic();

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const tags = await query;
    return {tags};
  }

  const tags = await getTagsWithCount(params.status);
  return {tags};
}
