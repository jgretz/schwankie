import {crawlUrl} from '../crawl/crawlUrl';
import {queryForLinkByUrl} from '../domain/linkByUrl.query';

export async function searchByUrl(url: string) {
  const existing = await queryForLinkByUrl(url);
  if (existing) {
    return existing;
  }

  const crawl = await crawlUrl(url);
  if (crawl) {
    return crawl;
  }

  return {};
}
