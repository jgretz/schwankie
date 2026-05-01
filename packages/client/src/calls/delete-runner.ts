import {apiFetch} from '../config';

export async function deleteRunner(workerId: string): Promise<{ok: true}> {
  return apiFetch<{ok: true}>(`/api/runners/${workerId}`, {
    method: 'DELETE',
  });
}
