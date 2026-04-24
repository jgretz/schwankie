import {z} from 'zod';

export const createLinkSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(['saved', 'queued']).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateLinkSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  content: z.string().optional(),
  status: z.enum(['saved', 'queued', 'archived']).optional(),
  enrichmentFailCount: z.coerce.number().optional(),
  enrichmentLastError: z.string().nullable().optional(),
  score: z.coerce.number().min(0).max(100).nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const bulkDeleteLinksSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
});

export const upsertLinkEmbeddingSchema = z.object({
  embedding: z.array(z.number()).min(1),
  model: z.string().min(1).max(100),
});

export const listLinksParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['saved', 'queued', 'archived']).optional(),
  tags: z.string().optional(),
  q: z.string().optional(),
  ids: z.string().optional(),
  needs_enrichment: z.coerce.boolean().optional(),
  dead_enrichment: z.coerce.boolean().optional(),
  sort: z.enum(['date', 'score']).optional(),
  needs_scoring: z.coerce.boolean().optional(),
});
