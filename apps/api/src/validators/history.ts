import {z} from 'zod';

export const searchHistorySchema = z.object({
  q: z.string().trim().min(3).max(300),
  days: z.enum(['7', '30', '90']).default('30').transform(Number),
});
