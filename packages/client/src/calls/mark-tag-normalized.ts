import {apiFetch} from '../config';

export function markTagNormalized(tagId: number): Promise<unknown> {
  return apiFetch(`/api/tags/${tagId}/normalize`, {
    method: 'PATCH',
  });
}
