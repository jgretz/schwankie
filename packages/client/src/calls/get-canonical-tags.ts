import {apiFetch} from '../config';
import type {TagsResponse} from '../types';

export function getCanonicalTags(): Promise<TagsResponse> {
  return apiFetch<TagsResponse>('/api/tags?canonical=true');
}
