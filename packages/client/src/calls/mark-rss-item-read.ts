import {apiFetch} from '../config';

export function markRssItemRead(feedId: string, itemId: string): Promise<{marked: boolean}> {
  return apiFetch<{marked: boolean}>(`/api/feeds/${feedId}/items/${itemId}/read`, {method: 'POST'});
}
