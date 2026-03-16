import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {createLink, deleteLink, fetchMetadata, updateLink} from './api-client';
import {env} from './env';
import {getSession} from './session';

async function requireAuth() {
  const session = await getSession();
  if (!session?.authenticated) {
    throw new Error('Unauthorized');
  }
}

const fetchMetadataInput = z.object({url: z.string().url()});

export const fetchMetadataAction = createServerFn({method: 'POST'})
  .inputValidator(fetchMetadataInput)
  .handler(async ({data}) => {
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
  .inputValidator(createLinkInput)
  .handler(async ({data}) => {
    await requireAuth();
    return createLink(env.API_KEY, data);
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
  .inputValidator(updateLinkInput)
  .handler(async ({data}) => {
    await requireAuth();
    const {id, ...input} = data;
    return updateLink(env.API_KEY, id, input);
  });

const deleteLinkInput = z.object({id: z.number()});

export const deleteLinkAction = createServerFn({method: 'POST'})
  .inputValidator(deleteLinkInput)
  .handler(async ({data}) => {
    await requireAuth();
    return deleteLink(env.API_KEY, data.id);
  });
