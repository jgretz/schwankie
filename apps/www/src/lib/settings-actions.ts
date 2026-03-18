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

const setSettingInput = z.object({key: z.string(), value: z.string()});

export const setSettingAction = createServerFn({method: 'POST'})
  .inputValidator(setSettingInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {setSetting} = await import('client');
    return setSetting(data.key, data.value);
  });
