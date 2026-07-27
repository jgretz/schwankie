import {z} from 'zod';

export const listPromoteFailuresSchema = z.object({
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  source: z.enum(['rss', 'email']).optional(),
});
