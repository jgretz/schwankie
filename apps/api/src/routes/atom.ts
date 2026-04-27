import {Hono} from 'hono';
import {listLinks} from '@domain';
import {createFeedHandler} from '../lib/feed-cache';
import {getLinksVersion} from '../lib/links-version';
import {renderAtom} from '../lib/atom-render';

const ATOM_CONTENT_TYPE = 'application/atom+xml; charset=utf-8';
const FEED_ITEM_LIMIT = 50;

export const atomRoutes = new Hono();

atomRoutes.get(
  '/api/atom',
  createFeedHandler({
    format: 'atom',
    contentType: ATOM_CONTENT_TYPE,
    render: renderAtom,
    fetchItems: async () => {
      const result = await listLinks({
        limit: FEED_ITEM_LIMIT,
        offset: 0,
        status: 'saved',
        sort: 'date',
      });
      return result.items;
    },
    getVersion: getLinksVersion,
  }),
);
