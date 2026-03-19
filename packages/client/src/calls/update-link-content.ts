import {apiFetch} from '../config';
import type {LinkData} from '../types';

export function updateLinkContent(id: number, content: string): Promise<LinkData> {
  return apiFetch<LinkData>(`/api/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({content}),
  });
}
