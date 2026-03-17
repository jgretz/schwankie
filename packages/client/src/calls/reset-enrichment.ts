import {apiFetch} from '../config';

export function resetEnrichment(id: number): Promise<{reset: boolean}> {
  return apiFetch(`/api/links/${id}/reset-enrichment`, {method: 'PATCH'});
}
