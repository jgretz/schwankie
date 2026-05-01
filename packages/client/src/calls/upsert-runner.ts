import {apiFetch} from '../config';
import type {UpsertRunnerInput} from '../types';

export async function upsertRunner(input: UpsertRunnerInput): Promise<{ok: true}> {
  return apiFetch<{ok: true}>('/api/runners', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
