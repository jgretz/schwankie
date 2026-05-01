import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {requireAuth, getClient} from './server-helpers';

export const getStatusAction = createServerFn({method: 'GET'}).handler(async () => {
  await getClient();
  await requireAuth();
  const {getStatus} = await import('client');
  return getStatus();
});

export const listRunnersAction = createServerFn({method: 'GET'}).handler(async () => {
  await getClient();
  await requireAuth();
  const {listRunners} = await import('client');
  return listRunners();
});

const deleteRunnerInput = z.object({workerId: z.string()});

export const deleteRunnerAction = createServerFn({method: 'POST'})
  .inputValidator(deleteRunnerInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {deleteRunner} = await import('client');
    return deleteRunner(data.workerId);
  });
