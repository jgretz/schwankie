import {apiFetch} from '../config';
import type {LinkData} from '../types';

export type RelatedLinkData = LinkData & {
  overlap: number | null;
  similarity: number | null;
};

export type RelatedLinksResponse = {items: RelatedLinkData[]};

export function getRelatedLinks(id: number, limit = 10): Promise<RelatedLinksResponse> {
  return apiFetch<RelatedLinksResponse>(`/api/links/${id}/related?limit=${limit}`);
}
