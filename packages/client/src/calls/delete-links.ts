import {apiFetch} from '../config';

export function deleteLinks(ids: number[]): Promise<{deleted: number}> {
  return apiFetch<{deleted: number}>('/api/links/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ids}),
  });
}
