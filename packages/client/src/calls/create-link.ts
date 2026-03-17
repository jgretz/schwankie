import {apiFetch} from '../config';
import type {CreateLinkInput, LinkData} from '../types';

export function createLink(data: CreateLinkInput): Promise<LinkData> {
  return apiFetch<LinkData>('/api/links', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
