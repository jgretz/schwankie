import {apiFetch} from '../config';
import type {BulkUpsertRssItemsInput} from '../types';

export function bulkUpsertRssItems(feedId: string, input: BulkUpsertRssItemsInput): Promise<{inserted: number}> {
  return apiFetch<{inserted: number}>(`/api/feeds/${feedId}/items/bulk-upsert`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
