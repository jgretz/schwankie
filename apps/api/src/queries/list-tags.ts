import type {Database} from 'database';
import {getTagsWithCount, tag, type LinkStatus} from 'database';
import {isNull, isNotNull} from 'drizzle-orm';

type ListTagsParams = {
  status?: LinkStatus;
  needs_normalization?: boolean;
  canonical?: boolean;
};

type TagWithCount = {id: number; text: string; count: number};
type TagSimple = {id: number; text: string};
type ListTagsResult = {tags: Array<TagWithCount | TagSimple>};

export async function listTags(db: Database, params: ListTagsParams): Promise<ListTagsResult> {
  if (params.needs_normalization) {
    const tags = await db
      .select({id: tag.id, text: tag.text})
      .from(tag)
      .where(isNull(tag.normalizedAt));
    return {tags};
  }

  if (params.canonical) {
    const tags = await db
      .select({id: tag.id, text: tag.text})
      .from(tag)
      .where(isNotNull(tag.normalizedAt));
    return {tags};
  }

  const tags = await getTagsWithCount(db, params.status);
  return {tags};
}
