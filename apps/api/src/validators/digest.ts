import {z} from 'zod';

/** A day, as `YYYY-MM-DD` — the shape of daily_summary.summary_date. */
const summaryDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const listDigestSourceItemsSchema = z.object({
  hours: z.coerce.number().int().min(1).max(720).default(24),
});

export const getDailySummarySchema = z.object({
  date: summaryDate.optional(),
});

export const digestTopicSchema = z.object({
  rank: z.number().int(),
  title: z.string().min(1),
  body: z.string(),
  itemCount: z.number().int().min(0),
  links: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      source: z.string(),
    }),
  ),
});

/**
 * The generator posts this. Everything but the topics is optional so a caller
 * that only has the clustering result still writes a valid row — the window
 * fields then describe a freshly computed default window.
 */
export const upsertDailySummarySchema = z.object({
  summaryDate: summaryDate.optional(),
  lookbackHours: z.number().int().min(1).max(720).optional(),
  windowStart: z.string().datetime().optional(),
  windowEnd: z.string().datetime().optional(),
  itemCount: z.number().int().min(0).optional(),
  notable: z.string().nullable().optional(),
  topics: z.array(digestTopicSchema),
});
