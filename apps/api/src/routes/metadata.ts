import {Hono} from 'hono';
import {fetchMetadataSchema} from '../validators/metadata';
import {fetchMetadata} from '../commands/fetch-metadata';

export const metadataRoutes = new Hono();

metadataRoutes.post('/fetch', async (c) => {
  const parsed = fetchMetadataSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({error: 'Invalid URL'}, 400);

  const result = await fetchMetadata(parsed.data.url);
  return c.json(result);
});
