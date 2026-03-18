import {z} from 'zod';
import {linkStatusEnum, type LinkStatus} from 'database';
import {normalizeTag} from '@domain';

export const listTagsParamsSchema = z.object({
  status: z.enum(linkStatusEnum.enumValues as [LinkStatus, ...LinkStatus[]]).optional(),
  needs_normalization: z.boolean().optional(),
  canonical: z.boolean().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
  minCount: z.coerce.number().int().min(1).optional(),
});

export const mergeTagSchema = z.object({
  canonicalTagId: z.number().int().positive(),
});

export const renameTagSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(200)
    .refine((text) => normalizeTag(text) !== null, {
      message: 'Tag must contain at least one letter or number',
    }),
});
