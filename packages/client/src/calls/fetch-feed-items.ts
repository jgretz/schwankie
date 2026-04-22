import {apiFetch} from '../config';
import type {RssItemData} from '../types';

type FetchFeedItemsParams = {
  feedId: string;
  limit?: number;
  offset?: number;
  read?: boolean;
  clicked?: boolean;
  q?: string;
};

export function fetchFeedItems(params: FetchFeedItemsParams): Promise<{items: RssItemData[]; total: number}> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.read != null) search.set('read', String(params.read));
  if (params.clicked != null) search.set('clicked', String(params.clicked));
  if (params.q) search.set('q', params.q);

  const qs = search.toString();
  return apiFetch<{items: RssItemData[]; total: number}>(`/api/feeds/${params.feedId}/items${qs ? `?${qs}` : ''}`);
}
