import {match} from 'ts-pattern';
import client from '../client';

export async function getRssFeedItems() {
  const result = await client.api.rss.index.get({query: {includeRead: 'false'}});

  return match(result.status)
    .with(200, () => result.data)
    .otherwise(() => {
      console.error(result.error?.value);
      return [];
    });
}
