import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireAuth, getClient} from './server-helpers';

const getDailySummaryInput = z.object({date: z.string().optional()});

/**
 * Reads go through a server function because the browser-side client is
 * initialised without an API key — a direct call from the page would 401.
 */
export const getDailySummaryAction = createServerFn({method: 'GET'})
  .inputValidator(getDailySummaryInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {fetchDailySummary} = await import('client');
    try {
      return await fetchDailySummary({date: data.date});
    } catch (error) {
      // A day with no digest is an expected empty state, not a failure.
      // apiFetch formats failures as `API error: <status> <statusText> — <body>`,
      // so match the prefix rather than looking for 404 anywhere in the message.
      if (error instanceof Error && error.message.startsWith('API error: 404')) return null;
      throw error;
    }
  });

export const listDailySummaryDatesAction = createServerFn({method: 'GET'}).handler(async () => {
  await getClient();
  await requireAuth();
  const {fetchDailySummaryDates} = await import('client');
  return fetchDailySummaryDates();
});
