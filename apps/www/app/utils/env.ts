import {parseEnv} from 'utility-env';
import {serverOnly$} from 'vite-env-only/macros';
import z from 'zod';

function pick<Data extends object, Keys extends keyof Data>(
  data: Data,
  keys: Keys[],
): Pick<Data, Keys> {
  const result = {} as Pick<Data, Keys>;

  for (const key of keys) {
    result[key] = data[key];
  }

  return result;
}

// server env - should be everything in the .env file
const serverEnvSchema = z.object({
  API_URL: z.string(),
});
type ServerEnv = z.infer<typeof serverEnvSchema>;

export const serverEnv = serverOnly$<ServerEnv>(parseEnv(serverEnvSchema)) ?? ({} as ServerEnv);

// client env - everything that will be exposed to the client
// ** DO NOT INCLUDE SENSITIVE INFORMATION HERE **
export function getClientEnv() {
  return pick(serverEnv, ['API_URL']);
}