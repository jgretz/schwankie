import {URLS} from '~/constants';
import type {SaveLink} from '~/Types';
import {crawlLink} from './crawlLink';

export async function saveLink(link: SaveLink) {
  const response = await fetch(URLS.SAVE_LINK, {
    method: 'POST',
    headers: {
      api_key: process.env.API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(link),
  });

  if (!response.ok) {
    return response;
  }

  // we need structure of nested objects and update just passess down 1 level of the join
  return await crawlLink({url: link.url});
}
