import {createDatabase} from 'database';
import {parseEnv} from 'env';
import {z} from 'zod';

const envSchema = z.object({DATABASE_URL: z.string()});
const env = parseEnv(envSchema);
export const db = createDatabase(env.DATABASE_URL);
