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

const renameTagInput = z.object({id: z.number(), text: z.string()});

export const renameTagAction = createServerFn({method: 'POST'})
  .inputValidator(renameTagInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {renameTag} = await import('client');
    return renameTag(data.id, data.text);
  });

const mergeTagInput = z.object({aliasId: z.number(), canonicalTagId: z.number()});

export const mergeTagAction = createServerFn({method: 'POST'})
  .inputValidator(mergeTagInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {mergeTag} = await import('client');
    await mergeTag(data.aliasId, data.canonicalTagId);
    return {merged: true};
  });

const deleteTagInput = z.object({id: z.number()});

export const deleteTagAction = createServerFn({method: 'POST'})
  .inputValidator(deleteTagInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {deleteTag} = await import('client');
    return deleteTag(data.id);
  });
