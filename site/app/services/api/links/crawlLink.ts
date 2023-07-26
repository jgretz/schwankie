import {URLS} from '~/constants/urls';
import type {CrawlLink} from '~/Types';

export async function crawlLink(crawl: CrawlLink) {
  const response = await fetch(URLS.CRAWL_LINK, {
    method: 'POST',
    headers: {
      api_key: process.env.API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(crawl),
  });

  return response;
}
