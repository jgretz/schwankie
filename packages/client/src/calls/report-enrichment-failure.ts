import {apiFetch} from '../config';
import type {LinkData} from '../types';

export function reportEnrichmentFailure(
  id: number,
  failCount: number,
  error: string,
): Promise<LinkData> {
  return apiFetch<LinkData>(`/api/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({enrichmentFailCount: failCount, enrichmentLastError: error}),
  });
}
