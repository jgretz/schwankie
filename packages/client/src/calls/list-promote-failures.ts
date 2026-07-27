import {apiFetch} from '../config';
import type {PromoteFailureData} from '../types';

type ListPromoteFailuresParams = {
  limit?: number;
  offset?: number;
  source?: 'rss' | 'email';
};

type ListPromoteFailuresResponse = {
  items: PromoteFailureData[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
};

export function listPromoteFailures(
  params: ListPromoteFailuresParams = {},
): Promise<ListPromoteFailuresResponse> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.source) search.set('source', params.source);

  const qs = search.toString();
  return apiFetch<ListPromoteFailuresResponse>(`/api/promote-failures${qs ? `?${qs}` : ''}`);
}
