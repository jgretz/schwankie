import {apiFetch} from '../config';

export function deleteFeed(id: string): Promise<{deleted: boolean}> {
  return apiFetch<{deleted: boolean}>(`/api/feeds/${id}`, {method: 'DELETE'});
}
