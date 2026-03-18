import type {link} from 'database';

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
