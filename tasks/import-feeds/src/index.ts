import {parseEnv} from 'utility-env';
import {z} from 'zod';
import {treaty} from '@elysiajs/eden';
import type {App} from '@api';

const env = parseEnv(
  z.object({
    API_URL: z.string(),
    API_KEY: z.string(),
  }),
);

async function main() {
  console.log('Importing feeds...');

  const client = treaty<App>(env.API_URL, {
    headers: {
      Authorization: `Bearer ${env.API_KEY}`,
    },
  });

  await client.api.rss.importLatestFromAllFeeds.post();

  console.log('Finished Importing feeds...');
}

await main();
