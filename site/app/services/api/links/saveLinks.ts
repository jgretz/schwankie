import {URLS} from '~/constants';
import type {SaveLink} from '~/Types';

export async function saveLink(link: SaveLink) {
  const response = await fetch(URLS.SAVE_LINK, {
    method: 'POST',
    headers: {
      api_key: process.env.API_KEY || '',
    },
    body: JSON.stringify(saveLink),
  });

  return response;
}
