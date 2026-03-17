import {apiFetch} from '../config';

export function updateLinkContent(id: number, content: string): Promise<unknown> {
  return apiFetch(`/api/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({content}),
  });
}
