import {z} from 'zod';

export const fetchMetadataSchema = z.object({
  url: z.string().url(),
});
