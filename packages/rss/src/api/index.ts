import {Elysia, t} from 'elysia';
import type {RssFeedItem} from '../Types';
import {buildFeedItemList} from '../services/buildFeedItemList';

export const Api = new Elysia({prefix: 'rss'}).get(
  '/',
  async function ({query: {includeRead}}): Promise<RssFeedItem[]> {
    const result = await buildFeedItemList(Boolean(includeRead));

    return result;
  },
  {
    query: t.Object({
      includeRead: t.String(),
    }),
  },
);
