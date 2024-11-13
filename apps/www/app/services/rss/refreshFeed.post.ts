import {match} from 'ts-pattern';
import client from '../client';

export async function refreshFeed() {
  const result = await client.api.rss.refresh.post();

  return match(result.status)
    .with(200, () => result.data)
    .otherwise(() => {
      console.error(result.error?.value);
      return [];
    });
}
