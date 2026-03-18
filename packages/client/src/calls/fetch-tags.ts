import {apiFetch} from '../config';
import type {LinkStatus, TagsResponse} from '../types';

export function fetchTags(params: {status?: LinkStatus; all?: boolean}): Promise<TagsResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.all) search.set('all', 'true');

  const qs = search.toString();
  return apiFetch<TagsResponse>(`/api/tags${qs ? `?${qs}` : ''}`);
}
