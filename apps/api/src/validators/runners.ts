import {z} from 'zod';

export const upsertRunnerSchema = z.object({
  workerId: z.string().uuid(),
  hostname: z.string().min(1),
  pid: z.number().int().positive(),
  version: z.string().nullable().optional(),
});

export const workerIdParamSchema = z.object({
  workerId: z.string().uuid(),
});
