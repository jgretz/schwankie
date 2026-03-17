import {apiFetch} from '../config';
import type {LinkMetadata} from '../types';

export function fetchMetadata(url: string): Promise<LinkMetadata> {
  return apiFetch<LinkMetadata>('/api/metadata/fetch', {
    method: 'POST',
    body: JSON.stringify({url}),
  });
}
