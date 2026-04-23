import {apiFetch} from '../config';
import type {RssItemWithFeedData} from '../types';

type ListAllRssItemsParams = {
  limit?: number;
  offset?: number;
  read?: boolean;
  feedId?: string;
};

export function listAllRssItems(
  params: ListAllRssItemsParams = {},
): Promise<{items: RssItemWithFeedData[]; total: number; hasMore: boolean; nextOffset: number}> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.read != null) search.set('read', String(params.read));
  if (params.feedId) search.set('feedId', params.feedId);

  const qs = search.toString();
  return apiFetch(`/api/rss-items${qs ? `?${qs}` : ''}`);
}
