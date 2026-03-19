import {apiFetch} from '../config';

export function mergeTag(aliasId: number, canonicalTagId: number): Promise<{merged: true}> {
  return apiFetch<{merged: true}>(`/api/tags/${aliasId}/merge`, {
    method: 'POST',
    body: JSON.stringify({canonicalTagId}),
  });
}
