import {z} from 'zod';

export const exchangeCodeSchema = z.object({
  code: z.string(),
});

export const setGmailFilterSchema = z.object({
  filter: z.string(),
});
