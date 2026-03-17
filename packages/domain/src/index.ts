export {init} from './db';

// queries
export {listLinks} from './queries/list-links';
export {listTags} from './queries/list-tags';
export {getLink} from './queries/get-link';

// commands
export {createLink} from './commands/create-link';
export {deleteLink} from './commands/delete-link';
export {updateLink} from './commands/update-link';
export {mergeTag} from './commands/merge-tag';
export {markTagNormalized} from './commands/normalize-tag';

// lib
export {normalizeTag} from './lib/normalize-tag';

// types
export type {
  LinkWithTags,
  ListLinksParams,
  ListLinksResult,
  ListTagsParams,
  ListTagsResult,
  TagWithCount,
  TagSimple,
  CreateLinkInput,
  UpdateLinkInput,
  MergeTagInput,
} from './types';
export type {LinkStatus} from './queries/get-tags-with-count';
