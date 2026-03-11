import type {Context, Next} from 'hono';
import {parseEnv} from 'env';
import z from 'zod';

const envSchema = z.object({
  API_KEY: z.string(),
});
const env = parseEnv(envSchema);

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({error: 'Unauthorized'}, 401);
    }

    const token = authHeader.slice(7);
    if (token !== env.API_KEY) {
      return c.json({error: 'Unauthorized'}, 401);
    }

    await next();
  };
}
