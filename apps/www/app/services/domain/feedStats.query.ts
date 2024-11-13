import {match} from 'ts-pattern';
import client from '../client';

export async function queryFeedStats() {
  const result = await client.api.feeds.stats.get();

  return match(result.status)
    .with(200, () => result.data)
    .otherwise(() => {
      console.error(result.error?.value);
      return undefined;
    });
}
