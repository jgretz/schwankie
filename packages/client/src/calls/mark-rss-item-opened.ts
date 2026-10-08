import {apiFetch} from '../config';

export function markRssItemOpened(feedId: string, itemId: string): Promise<{opened: boolean}> {
  return apiFetch<{opened: boolean}>(`/api/feeds/${feedId}/items/${itemId}/open`, {method: 'POST'});
}
