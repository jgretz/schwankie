import {apiFetch} from '../config';
import type {LinkData} from '../types';

export function promoteRssItem(feedId: string, itemId: string): Promise<LinkData> {
  return apiFetch<LinkData>(`/api/feeds/${feedId}/items/${itemId}/promote`, {method: 'POST'});
}
