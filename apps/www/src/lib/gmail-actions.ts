import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireAuth, getClient} from './server-helpers';

const exchangeGmailCodeInput = z.object({
  code: z.string(),
});

export const exchangeGmailCodeAction = createServerFn({method: 'POST'})
  .inputValidator(exchangeGmailCodeInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {exchangeGmailCode} = await import('client');
    return exchangeGmailCode(data.code);
  });

export const disconnectGmailAction = createServerFn({method: 'POST'}).handler(async () => {
  await getClient();
  await requireAuth();
  const {disconnectGmail} = await import('client');
  return disconnectGmail();
});

const setGmailFilterInput = z.object({
  filter: z.string(),
});

export const setGmailFilterAction = createServerFn({method: 'POST'})
  .inputValidator(setGmailFilterInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {setGmailFilter} = await import('client');
    return setGmailFilter(data.filter);
  });
