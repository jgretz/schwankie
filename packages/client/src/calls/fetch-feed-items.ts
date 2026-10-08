import {apiFetch} from '../config';
import type {RssItemData} from '../types';

type FetchFeedItemsParams = {
  feedId: string;
  limit?: number;
  offset?: number;
  read?: boolean;
  promoted?: boolean;
  q?: string;
};

type FetchFeedItemsResponse = {
  items: RssItemData[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
};

export function fetchFeedItems(params: FetchFeedItemsParams): Promise<FetchFeedItemsResponse> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.read != null) search.set('read', String(params.read));
  if (params.promoted != null) search.set('promoted', String(params.promoted));
  if (params.q) search.set('q', params.q);

  const qs = search.toString();
  return apiFetch<FetchFeedItemsResponse>(`/api/feeds/${params.feedId}/items${qs ? `?${qs}` : ''}`);
}
