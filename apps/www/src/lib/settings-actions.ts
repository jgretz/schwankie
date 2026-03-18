import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';

async function requireAuth() {
  const {getSession} = await import('./session.server');
  const session = await getSession();
  if (!session?.authenticated) {
    throw new Error('Unauthorized');
  }
}

async function getClient() {
  const {initClientServer} = await import('./init-client.server');
  initClientServer();
}

const getSettingInput = z.object({key: z.string()});

export const getSettingAction = createServerFn({method: 'GET'})
  .inputValidator(getSettingInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {getSetting} = await import('client');
    return getSetting(data.key);
  });

const setSettingInput = z.object({key: z.string(), value: z.string()});

export const setSettingAction = createServerFn({method: 'POST'})
  .inputValidator(setSettingInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {setSetting} = await import('client');
    return setSetting(data.key, data.value);
  });
