import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireAuth, getClient} from './server-helpers';

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
