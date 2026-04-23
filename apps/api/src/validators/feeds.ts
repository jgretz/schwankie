import {z} from 'zod';

// z.coerce.boolean() uses JS Boolean(), which treats "false" as truthy.
// Parse query-string bools explicitly so ?read=false means false.
const boolString = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'));

export const createFeedSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sourceUrl: z.string().url('Must be a valid URL'),
});

export const updateFeedSchema = z.object({
  name: z.string().min(1).optional(),
  sourceUrl: z.string().url().optional(),
  disabled: z.boolean().optional(),
  errorCount: z.number().int().nonnegative().optional(),
  lastError: z.string().nullable().optional(),
  lastFetchedAt: z.string().datetime().nullable().optional(),
});

// RSS items in the wild are messy — relative URLs, non-http schemes, non-ISO
// dates. Keep the schema permissive so one bad item doesn't drop the batch;
// the domain layer handles date coercion and onConflictDoNothing dedup.
export const bulkUpsertItemsSchema = z.object({
  items: z.array(
    z.object({
      guid: z.string().min(1),
      title: z.string(),
      link: z.string(),
      summary: z.string().optional(),
      content: z.string().optional(),
      imageUrl: z.string().optional(),
      pubDate: z.string().optional(),
    }),
  ),
});

export const listFeedItemsSchema = z.object({
  feedId: z.string(),
  limit: z.coerce.number().int().positive().default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  read: boolString,
  clicked: boolString,
  q: z.string().optional(),
});

export const listAllRssItemsSchema = z.object({
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  read: boolString,
  feedId: z.string().optional(),
});
