import {z} from 'zod';
import {PROMOTE_FAILURE_SOURCES} from 'database';

export const listPromoteFailuresSchema = z.object({
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  // Derived from the schema tuple so a new source can never be silently
  // rejected here, the way validators/tags.ts derives from linkStatusEnum.
  source: z.enum(PROMOTE_FAILURE_SOURCES).optional(),
});
