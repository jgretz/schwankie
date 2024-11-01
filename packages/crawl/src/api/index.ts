import {Elysia, t} from 'elysia';
import type {CrawlResult} from '../Types';
import {crawlSite} from '../services/crawlSite';

export const Api = new Elysia({prefix: 'crawl'}).get(
  '/',
  async function ({query: {url}}): Promise<CrawlResult> {
    const result = await crawlSite(url);

    return result;
  },
  {
    query: t.Object({
      url: t.String(),
    }),
  },
);
