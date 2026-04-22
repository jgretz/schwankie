import {apiFetch} from '../config';

export async function setGmailFilter(filter: string): Promise<{filter: string}> {
  return apiFetch<{filter: string}>('/api/gmail/filter', {
    method: 'POST',
    body: JSON.stringify({filter}),
  });
}
