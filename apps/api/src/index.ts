import swagger from '@elysiajs/swagger';
import {z} from 'zod';
import {Elysia} from 'elysia';

import {parseEnv} from 'utility-env';

import {setupLinksDomain, Api as LinksApi} from 'domain/links';
import {setupMiscDomain, Api as MiscApi} from 'domain/misc';
import {setupFeedsDomain, Api as FeedsApi} from 'domain/feeds';

import {ApiKeyPlugin, setupSecurity} from 'security';
import {setupMail} from 'mail';

import {Api as CrawlApi} from 'crawl';
import {Api as MailApi} from 'mail';
import {Api as RssApi} from 'rss';

// global variables
const envSchema = z.object({
  PORT: z.string().optional(),
});

const env = parseEnv(envSchema);
setupLinksDomain();
setupMiscDomain();
setupFeedsDomain();
setupSecurity();
setupMail();

// boot app
const app = new Elysia()
  .use(swagger())
  .group('api', (app) =>
    app
      .use(ApiKeyPlugin)
      .use(LinksApi)
      .use(MiscApi)
      .use(FeedsApi)
      .use(CrawlApi)
      .use(MailApi)
      .use(RssApi)
      .onError((error) => {
        console.error(error);
      }),
  )
  .listen({port: env.PORT || 3001, idleTimeout: 120});

console.log(`Schwankie API is running at ${app.server?.hostname}:${app.server?.port}`);

// export type for intellisense
export type App = typeof app;
