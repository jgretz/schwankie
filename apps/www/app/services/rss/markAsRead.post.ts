import {match} from 'ts-pattern';
import client from '../client';

export async function markAsRead(mostRecentId: number) {
  const result = await client.api.rss.markAsRead.post({mostRecentId});

  return match(result.status)
    .with(200, () => result.data)
    .otherwise(() => {
      console.error(result.error?.value);
      return [];
    });
}
