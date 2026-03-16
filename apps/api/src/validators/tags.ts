import {z} from 'zod';

export const listTagsParamsSchema = z.object({
  status: z.enum(['saved', 'queued', 'archived']).optional(),
});
