import {Hono} from 'hono';
import {cors} from 'hono/cors';
import z from 'zod';
import {parseEnv} from 'env';
import {init as initDomain} from '@domain';
import {healthRoutes} from './routes/health';
import {tagsRouter} from './routes/tags';
import {linksRoutes} from './routes/links';
import {metadataRoutes} from './routes/metadata';
import {settingsRouter} from './routes/settings';
import {gmailRouter} from './routes/gmail';
import {feedsRoutes} from './routes/feeds';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  API_KEY: z.string(),
  DATABASE_URL: z.string(),
});
const env = parseEnv(envSchema);

initDomain(env.DATABASE_URL);

const app = new Hono();

app.use('/*', cors());

// auth: each router handles its own auth
// reads (GET) are public; mutations require Bearer token
// see middleware/auth.ts
app.route('/', healthRoutes);
app.route('/', tagsRouter);
app.route('/', linksRoutes);
app.route('/', settingsRouter);
app.route('/', gmailRouter);
app.route('/', feedsRoutes);
app.route('/api/metadata', metadataRoutes);

app.onError((err, c) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('API error:', err);
  return c.json({error: message}, 500);
});

console.log(`schwankie-api is running on port ${env.PORT}`);

export default {
  port: Number(env.PORT),
  hostname: '0.0.0.0',
  fetch: app.fetch,
};
