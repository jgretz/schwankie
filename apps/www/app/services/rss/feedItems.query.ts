import {match} from 'ts-pattern';
import client from '../client';
import {SIZE} from '@www/constants/read.constants';

export async function queryRssFeedItems(page: number, includeRead = false, feedId = -1) {
  const result = await client.api.rss.index.get({query: {page, size: SIZE, includeRead, feedId}});

  return match(result.status)
    .with(200, () => result.data)
    .otherwise(() => {
      console.error(result.error?.value);
      return [];
    });
}
