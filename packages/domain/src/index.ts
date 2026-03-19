export {init} from './db';

// queries
export {listLinks} from './queries/list-links';
export {listTags} from './queries/list-tags';
export {getLink} from './queries/get-link';
export {getSetting} from './queries/get-setting';

// commands
export {createLink} from './commands/create-link';
export {deleteLink} from './commands/delete-link';
export {updateLink} from './commands/update-link';
export {mergeTag} from './commands/merge-tag';
export {renameTag} from './commands/rename-tag';
export {deleteTag} from './commands/delete-tag';
export {markTagNormalized} from './commands/normalize-tag';
export {resetEnrichment} from './commands/reset-enrichment';
export {setSetting} from './commands/set-setting';

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
  RenameTagInput,
  SettingResponse,
} from './types';
export type {LinkStatus} from './queries/get-tags-with-count';
