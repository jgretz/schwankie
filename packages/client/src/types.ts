export type LinkStatus = 'queued' | 'saved' | 'archived';

export type LinkData = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: LinkStatus;
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
  status?: 'saved' | 'queued' | 'archived';
  tags?: string[];
};
