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
