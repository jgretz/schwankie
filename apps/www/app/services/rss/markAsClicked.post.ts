import {match} from 'ts-pattern';
import client from '../client';

export async function markAsClicked(id: number) {
  const result = await client.api.rss.markAsClicked.post({id});

  return match(result.status)
    .with(200, () => result.data)
    .otherwise(() => {
      console.error(result.error?.value);
      return [];
    });
}
