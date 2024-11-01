import {match} from 'ts-pattern';
import client from '../client';

export async function crawlUrl(url: string) {
  const result = await client.api.crawl.index.get({query: {url}});

  return match(result.status)
    .with(200, () => result.data)
    .otherwise(() => {
      console.error(result.error?.value);
      return [];
    });
}
