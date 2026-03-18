import {Hono} from 'hono';
import {cors} from 'hono/cors';
import z from 'zod';
import {parseEnv} from 'env';
import {init as initDomain} from '@domain';
import {authMiddleware} from './middleware/auth';
import {healthRoutes} from './routes/health';
import {helloRoutes} from './routes/hello';
import {tagsRouter} from './routes/tags';
import {linksRoutes} from './routes/links';
import {metadataRoutes} from './routes/metadata';
import {settingsRouter} from './routes/settings';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  API_KEY: z.string(),
  DATABASE_URL: z.string(),
});
const env = parseEnv(envSchema);

initDomain(env.DATABASE_URL);

const app = new Hono();

app.use('/*', cors());

// public
app.route('/', healthRoutes);
app.route('/', tagsRouter);

// links — handles its own auth (GET is public, mutations are protected)
app.route('/', linksRoutes);

// settings — handles its own auth
app.route('/', settingsRouter);

// protected
app.use('/api/*', authMiddleware());
app.route('/api/hello', helloRoutes);
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
