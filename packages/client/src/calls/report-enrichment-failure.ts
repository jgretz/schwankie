import {apiFetch} from '../config';

export function reportEnrichmentFailure(
  id: number,
  failCount: number,
  error: string,
): Promise<unknown> {
  return apiFetch(`/api/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({enrichmentFailCount: failCount, enrichmentLastError: error}),
  });
}
