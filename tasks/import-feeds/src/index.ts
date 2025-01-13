import {parseEnv} from 'utility-env';
import {z} from 'zod';
import {treaty} from '@elysiajs/eden';
import type {App} from '@api';
import {match} from 'ts-pattern';

// environment schema
const envSchema = z.object({
  PORT: z.string().optional(),
  API_URL: z.string(),
  API_KEY: z.string(),
});

const env = parseEnv(envSchema);

// constants
const FEEDS_FINISHED = 'Finished Importing feeds...';
const FLY = 'Now the fly runner can be happy...';

// main logic
async function main() {
  console.log('Importing feeds...');

  const client = treaty<App>(env.API_URL, {
    headers: {
      Authorization: `Bearer ${env.API_KEY}`,
    },
  });

  await client.api.rss.importLatestFromAllFeeds.post();

  console.log(FEEDS_FINISHED);
}

// server
async function importResponse() {
  await main();

  setTimeout(() => {
    server.stop();
  }, 1000);

  return new Response(FEEDS_FINISHED);
}

function standardResponse() {
  console.log(FLY);
  return new Response(FLY);
}

const server = Bun.serve({
  port: env.PORT || 3005,
  async fetch(req) {
    const url = new URL(req.url);
    return await match(url.pathname).with('/import', importResponse).otherwise(standardResponse);
  },
});

server.fetch('/import');
