import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireAuth, getClient} from './server-helpers';

export const getGmailStatusAction = createServerFn({method: 'GET'}).handler(async () => {
  await getClient();
  await requireAuth();
  const {getGmailStatus} = await import('client');
  return getGmailStatus();
});

export const getGmailAuthUrlAction = createServerFn({method: 'GET'}).handler(async () => {
  await getClient();
  await requireAuth();
  const {getGmailAuthUrl} = await import('client');
  return getGmailAuthUrl();
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
