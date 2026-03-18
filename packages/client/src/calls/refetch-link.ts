import {apiFetch} from '../config';
import type {LinkData} from '../types';

export function refetchLink(id: number): Promise<LinkData> {
  return apiFetch(`/api/links/${id}/refetch`, {method: 'POST'});
}
