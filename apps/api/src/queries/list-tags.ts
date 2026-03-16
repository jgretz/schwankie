import type {Database} from 'database';
import {getTagsWithCount, type LinkStatus} from 'database';

type ListTagsParams = {status?: LinkStatus};
type ListTagsResult = {tags: Array<{id: number; text: string; count: number}>};

export async function listTags(db: Database, params: ListTagsParams): Promise<ListTagsResult> {
  const tags = await getTagsWithCount(db, params.status);
  return {tags};
}
