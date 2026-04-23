import {z} from 'zod';

export const createFeedSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sourceUrl: z.string().url('Must be a valid URL'),
});

export const updateFeedSchema = z.object({
  name: z.string().min(1).optional(),
  sourceUrl: z.string().url().optional(),
  disabled: z.boolean().optional(),
});

export const bulkUpsertItemsSchema = z.object({
  items: z.array(
    z.object({
      guid: z.string(),
      title: z.string(),
      link: z.string().url(),
      summary: z.string().optional(),
      content: z.string().optional(),
      imageUrl: z.string().url().optional(),
      pubDate: z.string().datetime().optional(),
    }),
  ),
});

export const listFeedItemsSchema = z.object({
  feedId: z.string(),
  limit: z.coerce.number().int().positive().default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  read: z.coerce.boolean().optional(),
  clicked: z.coerce.boolean().optional(),
  q: z.string().optional(),
});

export const listAllRssItemsSchema = z.object({
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  read: z.coerce.boolean().optional(),
  feedId: z.string().optional(),
});
