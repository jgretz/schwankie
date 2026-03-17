import {apiFetch} from '../config';
import type {LinksResponse} from '../types';

export function getLinksNeedingEnrichment(limit = 5): Promise<LinksResponse> {
  return apiFetch<LinksResponse>(`/api/links?needs_enrichment=true&limit=${limit}`);
}
