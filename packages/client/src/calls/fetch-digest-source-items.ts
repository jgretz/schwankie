import {apiFetch} from '../config';
import type {DigestSourceItemsResponse} from '../types';

type FetchDigestSourceItemsParams = {
  hours?: number;
};

export function fetchDigestSourceItems(
  params: FetchDigestSourceItemsParams = {},
): Promise<DigestSourceItemsResponse> {
  const search = new URLSearchParams();
  if (params.hours != null) search.set('hours', String(params.hours));

  const qs = search.toString();
  return apiFetch<DigestSourceItemsResponse>(`/api/digest/source-items${qs ? `?${qs}` : ''}`);
}
