export type LinkStatus = 'queued' | 'saved' | 'archived';

export type LinkData = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: LinkStatus;
  content: string | null;
  enrichmentFailCount: number;
  enrichmentLastError: string | null;
  score: number | null;
  createDate: string;
  updateDate: string;
  tags: Array<{id: number; text: string}>;
};

export type LinksResponse = {
  items: LinkData[];
  hasMore: boolean;
  nextOffset: number;
  total: number;
};

export type TagsResponse = {
  tags: Array<{id: number; text: string; count: number}>;
};

export type LinkMetadata = {
  title: string;
  description: string | null;
  imageUrl: string | null;
};

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

export type {SettingResponse} from '@domain';

export type GmailAuthUrlResponse = {
  url: string;
};

export type GmailConnectResponse = {
  connected: boolean;
  email: string;
};

export type GmailStatusResponse = {
  connected: boolean;
  filter: string | null;
  lastImportedAt: string | null;
  email?: string;
};

export type GmailTokensResponse = {
  accessToken: string;
  refreshToken: string;
  expiry: string;
};

export type FeedData = {
  id: string;
  name: string;
  sourceUrl: string;
  disabled: boolean;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RssItemData = {
  id: string;
  feedId: string;
  guid: string;
  title: string;
  link: string;
  summary: string | null;
  content: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  read: boolean;
  clicked: boolean;
  createdAt: string;
};

export type CreateFeedInput = {
  name: string;
  sourceUrl: string;
};

export type UpdateFeedInput = {
  name?: string;
  sourceUrl?: string;
  disabled?: boolean;
};

export type BulkUpsertRssItemsInput = {
  items: Array<{
    guid: string;
    title: string;
    link: string;
    summary?: string;
    content?: string;
    imageUrl?: string;
    pubDate?: string;
  }>;
};
