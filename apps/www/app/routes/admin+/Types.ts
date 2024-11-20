import type {CrawlResult} from 'crawl';
import type {Link} from 'domain/links';

export type SearchStatus = 'idle' | 'loading';
export type SearchData = Link | CrawlResult | undefined;

export type SearchContext = {
  status: [SearchStatus, (status: SearchStatus) => void];
  data: [SearchData, (data: SearchData) => void];
};
