import {apiFetch} from '../config';
import type {LinkData} from '../types';

export function promoteEmailItem(itemId: string): Promise<LinkData> {
  return apiFetch<LinkData>(`/api/emails/${itemId}/promote`, {method: 'POST'});
}
