import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {createLink, deleteLink, fetchMetadata, updateLink} from 'client';
import {initClientServer} from './init-client.server';
import {getSession} from './session.server';

initClientServer();

async function requireAuth() {
  const session = await getSession();
  if (!session?.authenticated) {
    throw new Error('Unauthorized');
  }
}

const fetchMetadataInput = z.object({url: z.string().url()});

export const fetchMetadataAction = createServerFn({method: 'POST'})
  .validator(fetchMetadataInput)
  .handler(async ({data}) => {
    await requireAuth();
    return fetchMetadata(data.url);
  });

const createLinkInput = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(['saved', 'queued']).optional(),
  tags: z.array(z.string()).optional(),
});

export const createLinkAction = createServerFn({method: 'POST'})
  .validator(createLinkInput)
  .handler(async ({data}) => {
    await requireAuth();
    return createLink(data);
  });

const updateLinkInput = z.object({
  id: z.number(),
  url: z.string().url().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(['saved', 'queued', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateLinkAction = createServerFn({method: 'POST'})
  .validator(updateLinkInput)
  .handler(async ({data}) => {
    await requireAuth();
    const {id, ...input} = data;
    return updateLink(id, input);
  });

const deleteLinkInput = z.object({id: z.number()});

export const deleteLinkAction = createServerFn({method: 'POST'})
  .validator(deleteLinkInput)
  .handler(async ({data}) => {
    await requireAuth();
    return deleteLink(data.id);
  });
