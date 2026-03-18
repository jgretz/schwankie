import {apiFetch} from '../config';

export function deleteTag(id: number): Promise<{deleted: boolean}> {
  return apiFetch(`/api/tags/${id}`, {
    method: 'DELETE',
  });
}
