import {z} from 'zod';

export const emailItemSchema = z.object({
  messageId: z.string(),
  emailFrom: z.string(),
  link: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const bulkUpsertEmailItemsSchema = z.object({
  items: z.array(emailItemSchema),
});
