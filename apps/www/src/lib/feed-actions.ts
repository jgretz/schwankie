import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {getClient, requireAuth} from './server-helpers';

export const fetchFeedsAction = createServerFn({method: 'GET'}).handler(async () => {
  await getClient();
  await requireAuth();
  const {fetchFeeds} = await import('client');
  return fetchFeeds();
});

const fetchFeedItemsInput = z.object({
  feedId: z.string(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  read: z.boolean().optional(),
  clicked: z.boolean().optional(),
  q: z.string().optional(),
});

export const fetchFeedItemsAction = createServerFn({method: 'GET'})
  .inputValidator(fetchFeedItemsInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {fetchFeedItems} = await import('client');
    return fetchFeedItems(data);
  });

const listAllRssItemsInput = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  read: z.boolean().optional(),
  feedId: z.string().optional(),
});

export const listAllRssItemsAction = createServerFn({method: 'GET'})
  .inputValidator(listAllRssItemsInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {listAllRssItems} = await import('client');
    return listAllRssItems(data);
  });

const createFeedInput = z.object({
  name: z.string().min(1),
  sourceUrl: z.string().url(),
});

export const createFeedAction = createServerFn({method: 'POST'})
  .inputValidator(createFeedInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {createFeed} = await import('client');
    return createFeed(data);
  });

const updateFeedInput = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  sourceUrl: z.string().url().optional(),
  disabled: z.boolean().optional(),
});

export const updateFeedAction = createServerFn({method: 'POST'})
  .inputValidator(updateFeedInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {updateFeed} = await import('client');
    const {id, ...input} = data;
    return updateFeed(id, input);
  });

const deleteFeedInput = z.object({id: z.string()});

export const deleteFeedAction = createServerFn({method: 'POST'})
  .inputValidator(deleteFeedInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {deleteFeed} = await import('client');
    return deleteFeed(data.id);
  });

const markRssItemReadInput = z.object({feedId: z.string(), itemId: z.string()});

export const markRssItemReadAction = createServerFn({method: 'POST'})
  .inputValidator(markRssItemReadInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {markRssItemRead} = await import('client');
    return markRssItemRead(data.feedId, data.itemId);
  });

const markAllRssItemsReadInput = z.object({feedId: z.string().optional()});

export const markAllRssItemsReadAction = createServerFn({method: 'POST'})
  .inputValidator(markAllRssItemsReadInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {markAllRssItemsRead} = await import('client');
    return markAllRssItemsRead(data.feedId);
  });

const promoteRssItemInput = z.object({feedId: z.string(), itemId: z.string()});

export const promoteRssItemAction = createServerFn({method: 'POST'})
  .inputValidator(promoteRssItemInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {promoteRssItem} = await import('client');
    return promoteRssItem(data.feedId, data.itemId);
  });
