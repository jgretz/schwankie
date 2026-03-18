import {apiFetch} from '../config';
import type {LinkStatus, LinksResponse} from '../types';

type FetchLinksParams = {
  limit?: number;
  offset?: number;
  status?: LinkStatus;
  tags?: string;
  q?: string;
  ids?: string;
  sort?: 'date' | 'score';
  needs_scoring?: boolean;
};

export function fetchLinks(params: FetchLinksParams): Promise<LinksResponse> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.status) search.set('status', params.status);
  if (params.tags) search.set('tags', params.tags);
  if (params.q) search.set('q', params.q);
  if (params.ids) search.set('ids', params.ids);
  if (params.sort) search.set('sort', params.sort);
  if (params.needs_scoring) search.set('needs_scoring', String(params.needs_scoring));

  const qs = search.toString();
  return apiFetch<LinksResponse>(`/api/links${qs ? `?${qs}` : ''}`);
}
