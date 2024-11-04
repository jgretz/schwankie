import swagger from '@elysiajs/swagger';
import {z} from 'zod';
import {Elysia} from 'elysia';

import {parseEnv} from 'utility-env';

import {setupDomain, Api as DomainApi} from 'domain/schwankie';
import {Api as CrawlApi} from 'crawl';
import enforceApiKey from './services/enforceApiKey';

// global variables
const envSchema = z.object({
  PORT: z.string().optional(),
});

const env = parseEnv(envSchema);
setupDomain();

// boot app
const app = new Elysia()
  .use(swagger())
  .group('api', (app) =>
    app
      .onBeforeHandle({}, ({request: {headers}}) => {
        if (!enforceApiKey(headers.get('Authorization'))) {
          throw new Error('Unauthorized');
        }
      })
      .use(DomainApi)
      .use(CrawlApi),
  )
  .listen(env.PORT || 3001);

console.log(`Schwankie API is running at ${app.server?.hostname}:${app.server?.port}`);

// export type for intellisense
export type App = typeof app;
