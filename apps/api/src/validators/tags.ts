import {z} from 'zod';
import {linkStatusEnum, type LinkStatus} from 'database';

export const listTagsParamsSchema = z.object({
  status: z.enum(linkStatusEnum.enumValues as [LinkStatus, ...LinkStatus[]]).optional(),
  needs_normalization: z.coerce.boolean().optional(),
  canonical: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

export const mergeTagSchema = z.object({
  canonicalTagId: z.number().int().positive(),
});
