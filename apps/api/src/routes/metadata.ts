import {Hono} from 'hono';
import {authMiddleware} from '../middleware/auth';
import {fetchMetadataSchema} from '../validators/metadata';
import {fetchMetadata} from '../commands/fetch-metadata';

export const metadataRoutes = new Hono();

const auth = authMiddleware();

metadataRoutes.post('/fetch', auth, async (c) => {
  const parsed = fetchMetadataSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({error: 'Invalid URL'}, 400);

  const result = await fetchMetadata(parsed.data.url);
  return c.json(result);
});
