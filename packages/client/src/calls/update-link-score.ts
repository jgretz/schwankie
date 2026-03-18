import {apiFetch} from '../config';
import type {LinkData} from '../types';

export function updateLinkScore(id: number, score: number): Promise<LinkData> {
  return apiFetch<LinkData>(`/api/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({score}),
  });
}
