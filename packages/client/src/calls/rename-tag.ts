import {apiFetch} from '../config';

export function renameTag(id: number, text: string): Promise<{renamed: boolean}> {
  return apiFetch(`/api/tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({text}),
  });
}
