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

const fetchMetadataInput = z.object({url: z.string().url()});

export const fetchMetadataAction = createServerFn({method: 'POST'})
  .inputValidator(fetchMetadataInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {fetchMetadata} = await import('client');
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
    await getClient();
    await requireAuth();
    const {createLink} = await import('client');
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
  .inputValidator(updateLinkInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {updateLink} = await import('client');
    const {id, ...input} = data;
    return updateLink(id, input);
  });

const resetEnrichmentInput = z.object({id: z.number()});

export const resetEnrichmentAction = createServerFn({method: 'POST'})
  .inputValidator(resetEnrichmentInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {resetEnrichment} = await import('client');
    return resetEnrichment(data.id);
  });

const deleteLinkInput = z.object({id: z.number()});

export const deleteLinkAction = createServerFn({method: 'POST'})
  .inputValidator(deleteLinkInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {deleteLink} = await import('client');
    return deleteLink(data.id);
  });
