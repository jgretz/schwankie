import {Hono} from 'hono';
import {z} from 'zod';
import {extractMetadata} from 'metadata';

const fetchBodySchema = z.object({
  url: z.string().url(),
});

export const metadataRoutes = new Hono();

metadataRoutes.post('/fetch', async (c) => {
  const body = await c.req.json();
  const parsed = fetchBodySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({error: 'Invalid URL'}, 400);
  }

  const metadata = await extractMetadata(parsed.data.url);
  return c.json(metadata);
});
