import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireAuth, getClient} from './server-helpers';

const searchHistoryInput = z.object({
  q: z.string().trim().min(3).max(300),
  days: z.union([z.literal(7), z.literal(30), z.literal(90)]),
});

/** The search endpoint is auth-protected, so it can only be reached server-side. */
export const searchHistoryAction = createServerFn({method: 'GET'})
  .inputValidator(searchHistoryInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {searchHistory} = await import('client');
    return searchHistory({q: data.q, days: data.days});
  });
