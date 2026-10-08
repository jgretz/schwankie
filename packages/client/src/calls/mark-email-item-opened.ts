import {apiFetch} from '../config';

export function markEmailItemOpened(itemId: string): Promise<{opened: boolean}> {
  return apiFetch<{opened: boolean}>(`/api/emails/${itemId}/open`, {method: 'POST'});
}
