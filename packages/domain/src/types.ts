import type {emailItem, feed, link, rssItem, workRequest} from 'database';

export type EmailItem = typeof emailItem.$inferSelect;

export type CreateEmailItemInput = {
  emailMessageId: string;
  emailFrom: string;
  link: string;
  title?: string;
  description?: string;
  importedAt?: Date;
};

export type ListEmailItemsParams = {
  limit: number;
  offset: number;
  read?: boolean;
  from?: string;
};

export type ListEmailItemsResult = {
  items: EmailItem[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
};

export type GmailTokens = {
  accessToken: string;
  refreshToken: string;
  expiry: Date;
};

export type LinkWithTags = typeof link.$inferSelect & {
  tags: Array<{id: number; text: string}>;
};

export type ListLinksParams = {
  limit: number;
  offset: number;
  status?: 'saved' | 'queued' | 'archived';
  tags?: string;
  q?: string;
  ids?: string;
  needs_enrichment?: boolean;
  dead_enrichment?: boolean;
  sort?: 'date' | 'score';
  needs_scoring?: boolean;
};

export type ListLinksResult = {
  items: LinkWithTags[];
  hasMore: boolean;
  nextOffset: number;
  total: number;
};

export type ListTagsParams = {
  status?: 'queued' | 'saved' | 'archived' | 'trashed';
  needs_normalization?: boolean;
  canonical?: boolean;
  limit?: number;
  minCount?: number;
};

export type TagWithCount = {id: number; text: string; count: number};
export type TagSimple = {id: number; text: string};
export type ListTagsResult = {tags: Array<TagWithCount | TagSimple>};

export type CreateLinkInput = {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  status?: 'saved' | 'queued';
  tags?: string[];
};

export type UpdateLinkInput = {
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  content?: string;
  status?: 'saved' | 'queued' | 'archived';
  enrichmentFailCount?: number;
  enrichmentLastError?: string | null;
  score?: number | null;
  tags?: string[];
};

export type MergeTagInput = {aliasTagId: number; canonicalTagId: number};
export type RenameTagInput = {id: number; text: string};
export type SettingResponse = {key: string; value: string};

export type Feed = typeof feed.$inferSelect;
export type CreateFeedInput = {
  name: string;
  sourceUrl: string;
};

export type UpdateFeedInput = {
  name?: string;
  sourceUrl?: string;
  lastFetchedAt?: string | null;
  errorCount?: number;
  lastError?: string | null;
  disabled?: boolean;
};

export type RssItem = typeof rssItem.$inferSelect;
export type CreateRssItemInput = {
  feedId: string;
  guid: string;
  title: string;
  link: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  publishedAt?: string;
};

export type ListRssItemsParams = {
  feedId: string;
  limit?: number;
  offset?: number;
  read?: boolean;
  clicked?: boolean;
  q?: string;
};

export type ListRssItemsResult = {
  items: RssItem[];
  hasMore: boolean;
  nextOffset: number;
  total: number;
};

export type RssItemWithFeed = RssItem & {feedName: string};

export type ListAllRssItemsParams = {
  limit?: number;
  offset?: number;
  read?: boolean;
  feedId?: string;
};

export type ListAllRssItemsResult = {
  items: RssItemWithFeed[];
  hasMore: boolean;
  nextOffset: number;
  total: number;
};

export type WorkRequest = typeof workRequest.$inferSelect;
export type WorkRequestType = 'refresh-all-feeds' | 'refresh-emails';

export type CreateWorkRequestInput = {
  type: WorkRequestType;
  payload?: Record<string, unknown>;
};
