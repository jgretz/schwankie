import {Hono} from 'hono';
import {cors} from 'hono/cors';
import z from 'zod';
import {parseEnv} from 'env';
import {authMiddleware} from './middleware/auth';
import {healthRoutes} from './routes/health';
import {helloRoutes} from './routes/hello';
import {tagsRouter} from './routes/tags';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  API_KEY: z.string(),
});
const env = parseEnv(envSchema);

const app = new Hono();

app.use('/*', cors());

// public
app.route('/', healthRoutes);
app.route('/', tagsRouter);

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
