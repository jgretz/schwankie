import {Hono} from 'hono';
import {
  digestWindow,
  getDailySummary,
  listDailySummaryDates,
  listDigestSourceItems,
  localSummaryDate,
  upsertDailySummary,
} from '@domain';
import {authMiddleware} from '../middleware/auth';
import {
  getDailySummarySchema,
  listDigestSourceItemsSchema,
  upsertDailySummarySchema,
} from '../validators/digest';

export const digestRoutes = new Hono();
const auth = authMiddleware();

/**
 * The clustering input. Returns an OBJECT rather than a bare array because the
 * generator sequence parses it with a transform that rejects a top-level array.
 */
digestRoutes.get('/api/digest/source-items', auth, async (c) => {
  const parsed = listDigestSourceItemsSchema.safeParse({hours: c.req.query('hours')});
  if (!parsed.success) {
    return c.json({error: 'Invalid query parameters', details: parsed.error.flatten()}, 400);
  }

  const result = await listDigestSourceItems({hours: parsed.data.hours});
  return c.json(result);
});

digestRoutes.get('/api/digest/daily-summary/dates', auth, async (c) => {
  const dates = await listDailySummaryDates();
  return c.json({dates});
});

digestRoutes.get('/api/digest/daily-summary', auth, async (c) => {
  const parsed = getDailySummarySchema.safeParse({date: c.req.query('date') || undefined});
  if (!parsed.success) {
    return c.json({error: 'Invalid query parameters', details: parsed.error.flatten()}, 400);
  }

  const summary = await getDailySummary(parsed.data.date);
  if (!summary) {
    return c.json({error: 'Daily summary not found'}, 404);
  }

  return c.json(summary);
});

digestRoutes.post('/api/digest/daily-summary', auth, async (c) => {
  const parsed = upsertDailySummarySchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }

  const {topics, notable} = parsed.data;
  const now = new Date();
  const lookbackHours = parsed.data.lookbackHours ?? 24;
  const fallback = digestWindow(now, lookbackHours);

  // What the topics account for. Always derivable, so it never needs sending.
  const coveredCount =
    parsed.data.coveredCount ?? topics.reduce((sum, topic) => sum + topic.itemCount, 0);

  const summary = await upsertDailySummary({
    summaryDate: parsed.data.summaryDate ?? localSummaryDate(now),
    lookbackHours,
    windowStart: parsed.data.windowStart ? new Date(parsed.data.windowStart) : fallback.windowStart,
    windowEnd: parsed.data.windowEnd ? new Date(parsed.data.windowEnd) : fallback.windowEnd,
    // The window size is only knowable by the caller that queried it. Falling
    // back to coveredCount keeps the invariant covered <= item rather than
    // claiming a window of zero.
    itemCount: parsed.data.itemCount ?? coveredCount,
    coveredCount,
    notable: notable ?? null,
    topics,
  });

  return c.json(summary, 201);
});
