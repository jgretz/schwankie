import {apiFetch} from '../config';
import type {WorkRequestData} from '../types';

export async function startWorkRequest(id: string): Promise<WorkRequestData | null> {
  try {
    return await apiFetch<WorkRequestData>(`/api/work/${id}/start`, {
      method: 'POST',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('409')) {
      return null;
    }
    throw error;
  }
}
