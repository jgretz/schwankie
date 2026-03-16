import {parseEnv} from 'env';
import {z} from 'zod';

const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string().url(),
  ALLOWED_EMAIL: z.string().email(),
  SESSION_SECRET: z.string().min(32),
  API_KEY: z.string(),
});

export const env = parseEnv(envSchema);
