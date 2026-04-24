import {createServerFn} from '@tanstack/react-start';
import {requireAuth, getClient} from './server-helpers';

export const getStatusAction = createServerFn({method: 'GET'}).handler(async () => {
  await getClient();
  await requireAuth();
  const {getStatus} = await import('client');
  return getStatus();
});
