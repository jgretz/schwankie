import {URLS} from '~/constants';
import type {LinkSearchResponseItem} from '../../../Types';
import {appendParams} from '../../util/appendParams';

interface Params {
  query?: string;
  size?: number;
}

export async function loadLinks({query, size}: Params) {
  const URL = appendParams(URLS.SEARCH, [
    ['query', query],
    ['take', size],
  ]);

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
