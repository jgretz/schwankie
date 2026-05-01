import {apiFetch} from '../config';

export async function recordRunnerHeartbeat(workerId: string): Promise<{ok: true}> {
  return apiFetch<{ok: true}>(`/api/runners/${workerId}/heartbeat`, {
    method: 'POST',
  });
}
