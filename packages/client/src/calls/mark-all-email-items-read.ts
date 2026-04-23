import {apiFetch} from '../config';

export function markAllEmailItemsRead(from?: string): Promise<{count: number}> {
  const qs = from ? `?from=${encodeURIComponent(from)}` : '';
  return apiFetch<{count: number}>(`/api/emails/mark-all-read${qs}`, {method: 'POST'});
}
