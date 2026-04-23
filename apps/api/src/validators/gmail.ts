import {z} from 'zod';

export const setGmailFilterSchema = z.object({
  filter: z.string(),
});
