import {parseEnv} from 'utility-env';
import {z} from 'zod';
import {treaty} from '@elysiajs/eden';
import type {App} from '@api';

const envSchema = z.object({
  PORT: z.string().optional(),
  API_URL: z.string(),
  API_KEY: z.string(),
});

const env = parseEnv(envSchema);

async function main() {
  console.log('Importing feeds...');

  const client = treaty<App>(env.API_URL, {
    headers: {
      Authorization: `Bearer ${env.API_KEY}`,
    },
  });

  await client.api.rss.importLatestFromAllFeeds.post();
}

const server = Bun.serve({
  port: env.PORT || 3005,
  async fetch(req) {
    if (req.url === '/') {
      return new Response('Now the fly runner can be happy...');
    }

    await main();

    setTimeout(() => {
      server.stop();
    }, 1000);

    return new Response('Finished Importing feeds...');
  },
});

server.fetch('/import');
