import {apiFetch} from '../config';
import type {WorkRequestData} from '../types';

export function failWorkRequest(id: string, errorMessage: string): Promise<WorkRequestData> {
  return apiFetch<WorkRequestData>(`/api/work/${id}/fail`, {
    method: 'POST',
    body: JSON.stringify({errorMessage}),
  });
}
