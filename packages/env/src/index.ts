import {z} from 'zod';

export function parseEnv<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  const env = process.env;
  const result = schema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.message}`);
  }

  return result.data;
}
