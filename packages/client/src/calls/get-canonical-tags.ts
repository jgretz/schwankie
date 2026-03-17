import {apiFetch} from '../config';
import type {TagsResponse} from '../types';

export function getCanonicalTags(limit?: number): Promise<TagsResponse> {
  const params = new URLSearchParams({canonical: 'true'});
  if (limit) params.set('limit', String(limit));
  return apiFetch<TagsResponse>(`/api/tags?${params}`);
}
