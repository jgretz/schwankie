import {apiFetch} from '../config';
import type {LinksResponse} from '../types';

export function fetchDeadLinks(limit = 50, offset = 0): Promise<LinksResponse> {
  return apiFetch<LinksResponse>(`/api/links?dead_enrichment=true&limit=${limit}&offset=${offset}`);
}
