import {SEARCH_URL} from '~/constants';
import type {LinkSearchResponseItem} from '../../Types';

export async function loadLinks(query?: string) {
  const URL = SEARCH_URL + new URLSearchParams([['query', query || '']]);

  const response = await fetch(URL, {
    headers: {
      api_key: process.env.API_KEY || '',
    },
  });

  if (response.status !== 200) {
    console.warn('Unable to get links feed');
    return [];
  }

  return (await response.json()) as LinkSearchResponseItem[];
}
