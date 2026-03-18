import {apiFetch} from '../config';
import type {LinksResponse} from '../types';

export function getLinksNeedingScoring(limit = 5): Promise<LinksResponse> {
  return apiFetch<LinksResponse>(`/api/links?needs_scoring=true&limit=${limit}`);
}
