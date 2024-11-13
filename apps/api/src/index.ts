import swagger from '@elysiajs/swagger';
import {z} from 'zod';
import {Elysia} from 'elysia';

import {parseEnv} from 'utility-env';

import {setupDomain, Api as DomainApi} from 'domain/schwankie';
import {Api as CrawlApi} from 'crawl';
import {ApiKeyPlugin, setupSecurity} from 'security';
import {Api as RssApi} from 'rss';

// global variables
const envSchema = z.object({
  PORT: z.string().optional(),
});

const env = parseEnv(envSchema);
setupDomain();
setupSecurity();

// boot app
const app = new Elysia()
  .use(swagger())
  .group('api', (app) => app.use(ApiKeyPlugin).use(DomainApi).use(CrawlApi).use(RssApi))
  .listen({port: env.PORT || 3001, idleTimeout: 60});

console.log(`Schwankie API is running at ${app.server?.hostname}:${app.server?.port}`);

// export type for intellisense
export type App = typeof app;
