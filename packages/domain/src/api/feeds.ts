import {Elysia} from 'elysia';
import type {FeedStats} from '../Types';
import {feedStatsQuery} from '../queries';

export const FeedsApi = new Elysia({prefix: 'feeds'}).get('/stats', async function (): Promise<
  FeedStats | undefined
> {
  const stats = await feedStatsQuery();

  return stats;
});
