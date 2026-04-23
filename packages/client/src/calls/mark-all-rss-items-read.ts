import {apiFetch} from '../config';

export function markAllRssItemsRead(feedId?: string): Promise<{count: number}> {
  const qs = feedId ? `?feedId=${encodeURIComponent(feedId)}` : '';
  return apiFetch<{count: number}>(`/api/rss-items/mark-all-read${qs}`, {method: 'POST'});
}
