import {apiFetch} from '../config';
import type {WorkRequestData} from '../types';

export function completeWorkRequest(id: string): Promise<WorkRequestData> {
  return apiFetch<WorkRequestData>(`/api/work/${id}/complete`, {
    method: 'POST',
  });
}
