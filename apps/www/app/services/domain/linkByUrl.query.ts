import {match} from 'ts-pattern';
import client from '../client';

export async function queryForLinkByUrl(url: string) {
  const result = await client.api.links.byurl.get({query: {url}});

  return match(result.status)
    .with(200, () => result.data)
    .otherwise(() => {
      console.error(result.error?.value);
      return [];
    });
}
