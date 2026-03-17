import {apiFetch} from '../config';

export function deleteLink(id: number): Promise<{deleted: boolean}> {
  return apiFetch<{deleted: boolean}>(`/api/links/${id}`, {
    method: 'DELETE',
  });
}
