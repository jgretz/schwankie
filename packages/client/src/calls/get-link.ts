import {apiFetch} from '../config';
import type {LinkData} from '../types';

export function getLink(id: number): Promise<LinkData> {
  return apiFetch<LinkData>(`/api/links/${id}`);
}
