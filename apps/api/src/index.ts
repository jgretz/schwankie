import {Hono} from 'hono';
import {cors} from 'hono/cors';
import z from 'zod';
import {parseEnv} from 'env';
import {authMiddleware} from './middleware/auth';
import {healthRoutes} from './routes/health';
import {helloRoutes} from './routes/hello';
import {linksRoutes} from './routes/links';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  API_KEY: z.string(),
});
const env = parseEnv(envSchema);

const app = new Hono();

app.use('/*', cors());

// public
app.route('/', healthRoutes);

// links — handles its own auth (GET is public, mutations are protected)
app.route('/', linksRoutes);

// protected
app.use('/api/*', authMiddleware());
app.route('/api/hello', helloRoutes);

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
