// Internal Types
export interface TagListItem {
  id: number;
  text: string;
  color: string;
  support: string;
}

export interface User {
  email: string;
}

// Submission Types
export interface CrawlLink {
  url: string;
}

export interface SaveLink {
  url: string;
  title: string;
  description?: string;
  tags: string;
  image_url?: string;
}

// Response Types
export interface LinkTag {
  tag: {
    id: number;
    text: string;
  };
}
export interface LinkSearchResponseItem {
  id: number;
  url: string;
  title: string;
  description?: string;
  image_url?: string;

  update_date: string;

  link_tag: LinkTag[];
}

export interface RecentTagsResponseItem {
  tag: {
    id: number;
    text: string;
    create_date: Date;
    update_date: Date;
  };
}

export interface TopTagsResponsItem {
  id: number;
  text: string;
  _count: {
    link_tag: number;
  };
}

// Loader Types
export interface IndexLoaderData {
  links: LinkSearchResponseItem[];

  mainTags: TagListItem[];
  topTags: TagListItem[];
  recentTags: TagListItem[];
}
