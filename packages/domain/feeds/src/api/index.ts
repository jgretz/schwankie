import {Elysia} from 'elysia';
import type {Feed} from '../Types';
import {feedsQuery, feedStatsQuery} from '../queries';

export const Api = new Elysia({prefix: 'feeds'})
  .get('/', async function (): Promise<Feed[]> {
    const feeds = await feedsQuery();

    return feeds;
  })
  .get('/stats', async function (): ReturnType<typeof feedStatsQuery> {
    const stats = await feedStatsQuery();

    return stats;
  });
