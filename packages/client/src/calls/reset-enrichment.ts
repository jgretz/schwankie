import {apiFetch} from '../config';

export function resetEnrichment(id: number): Promise<unknown> {
  return apiFetch(`/api/links/${id}/reset-enrichment`, {method: 'PATCH'});
}
