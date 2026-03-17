import {apiFetch} from '../config';
import type {LinkStatus, TagsResponse} from '../types';

export function fetchTags(params: {status?: LinkStatus}): Promise<TagsResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);

  const qs = search.toString();
  return apiFetch<TagsResponse>(`/api/tags${qs ? `?${qs}` : ''}`);
}
