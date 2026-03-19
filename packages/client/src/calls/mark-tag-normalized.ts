import {apiFetch} from '../config';

export function markTagNormalized(tagId: number): Promise<{normalized: true}> {
  return apiFetch<{normalized: true}>(`/api/tags/${tagId}/normalize`, {
    method: 'PATCH',
  });
}
