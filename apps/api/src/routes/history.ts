import {Hono} from 'hono';
import {searchHistoryCandidates} from '@domain';
import {searchHistory} from '../commands/search-history';
import {authMiddleware} from '../middleware/auth';
import {searchHistorySchema} from '../validators/history';

export const historyRoutes = new Hono();
const auth = authMiddleware();

historyRoutes.get('/api/history/search', auth, async (c) => {
  const parsed = searchHistorySchema.safeParse({q: c.req.query('q'), days: c.req.query('days')});
  if (!parsed.success) {
    return c.json({error: 'Invalid query parameters', details: parsed.error.flatten()}, 400);
  }

  const result = await searchHistory(parsed.data, {
    findCandidates: searchHistoryCandidates,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });
  return c.json(result);
});
