import {apiFetch} from '../config';
import type {TagsResponse} from '../types';

export function getTagsNeedingNormalization(): Promise<TagsResponse> {
  return apiFetch<TagsResponse>('/api/tags?needs_normalization=true');
}
