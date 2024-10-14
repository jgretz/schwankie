import {match} from 'ts-pattern';
import client from '../client';
import {SIZE} from '@www/constants/read.constants';

export async function queryLinks(page: number) {
  const result = await client.api.links.index.get({query: {page, size: SIZE}});

  return match(result.status)
    .with(200, () => result.data)
    .otherwise(() => {
      console.error(result.error?.value);
      return [];
    });
}
