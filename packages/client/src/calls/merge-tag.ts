import {apiFetch} from '../config';

export function mergeTag(aliasId: number, canonicalTagId: number): Promise<unknown> {
  return apiFetch(`/api/tags/${aliasId}/merge`, {
    method: 'POST',
    body: JSON.stringify({canonicalTagId}),
  });
}
