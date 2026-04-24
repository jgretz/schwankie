import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireAuth, getClient} from './server-helpers';

const listEmailItemsInput = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  read: z.boolean().optional(),
  from: z.string().optional(),
});

export const listEmailItemsAction = createServerFn({method: 'GET'})
  .inputValidator(listEmailItemsInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {listEmailItems} = await import('client');
    return listEmailItems(data);
  });

const markEmailItemReadInput = z.object({
  id: z.string(),
});

export const markEmailItemReadAction = createServerFn({method: 'POST'})
  .inputValidator(markEmailItemReadInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {markEmailItemRead} = await import('client');
    return markEmailItemRead(data.id);
  });

const promoteEmailItemInput = z.object({
  id: z.string(),
});

export const promoteEmailItemAction = createServerFn({method: 'POST'})
  .inputValidator(promoteEmailItemInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {promoteEmailItem} = await import('client');
    return promoteEmailItem(data.id);
  });

const markAllEmailItemsReadInput = z.object({from: z.string().optional()});

export const markAllEmailItemsReadAction = createServerFn({method: 'POST'})
  .inputValidator(markAllEmailItemsReadInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {markAllEmailItemsRead} = await import('client');
    return markAllEmailItemsRead(data.from);
  });
