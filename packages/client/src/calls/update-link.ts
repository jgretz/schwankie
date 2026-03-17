import {apiFetch} from '../config';
import type {LinkData, UpdateLinkInput} from '../types';

export function updateLink(id: number, data: UpdateLinkInput): Promise<LinkData> {
  return apiFetch<LinkData>(`/api/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
