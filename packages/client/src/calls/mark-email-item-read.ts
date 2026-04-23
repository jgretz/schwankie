import {apiFetch} from '../config';

export function markEmailItemRead(itemId: string): Promise<{marked: boolean}> {
  return apiFetch<{marked: boolean}>(`/api/emails/${itemId}/read`, {method: 'POST'});
}
