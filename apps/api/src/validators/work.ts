import {z} from 'zod';

export const workIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const failBodySchema = z.object({
  errorMessage: z.string().min(1),
});
