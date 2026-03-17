import {apiFetch} from '../config';
import type {LinkStatus, LinksResponse} from '../types';

type FetchLinksParams = {
  limit?: number;
  offset?: number;
  status?: LinkStatus;
  tags?: string;
  q?: string;
};

export function fetchLinks(params: FetchLinksParams): Promise<LinksResponse> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.status) search.set('status', params.status);
  if (params.tags) search.set('tags', params.tags);
  if (params.q) search.set('q', params.q);

  const qs = search.toString();
  return apiFetch<LinksResponse>(`/api/links${qs ? `?${qs}` : ''}`);
}
