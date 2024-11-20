import {Elysia, t} from 'elysia';
import type {RssFeedItem} from '../Types';
import {feedItemsQuery} from 'domain/feeds';
import {mapFeedItemToRssFeedItem} from '../services/maps/feedItemToRssFeedItem.map';

export const GetApi = new Elysia().get(
  '/',
  async function ({query: {page, size, includeRead, feedId}}): Promise<RssFeedItem[]> {
    const query = {
      page,
      size,
      includeRead,
      feedId: feedId < 0 ? undefined : feedId,
    };

    const result = await feedItemsQuery(query);
    const feedItems = result.map(mapFeedItemToRssFeedItem);

    return feedItems;
  },
  {
    query: t.Object({
      page: t.Number(),
      size: t.Number(),
      includeRead: t.Boolean(),
      feedId: t.Number(),
    }),
  },
);
