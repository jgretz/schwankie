import {apiFetch} from '../config';

export function deleteTag(id: number): Promise<unknown> {
  return apiFetch(`/api/tags/${id}`, {
    method: 'DELETE',
  });
}
