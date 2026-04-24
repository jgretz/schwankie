export {init} from './db';

// queries
export {listLinks} from './queries/list-links';
export {listTags} from './queries/list-tags';
export {getLink} from './queries/get-link';
export {getSetting} from './queries/get-setting';
export {resolveTagMinCount} from './queries/resolve-tag-min-count';
export {listFeeds} from './queries/list-feeds';
export {getFeed} from './queries/get-feed';
export {listRssItems} from './queries/list-rss-items';
export {listAllRssItems} from './queries/list-all-rss-items';
export {markAllRssItemsRead} from './commands/mark-all-rss-items-read';
export {listEmailItems} from './queries/list-email-items';
export {countRecentEmailItems} from './queries/count-recent-email-items';
export {getStatus} from './queries/get-status';
export {getEmailItem} from './queries/get-email-item';
export {getGmailTokens} from './queries/get-gmail-tokens';
export {listPendingWorkRequests} from './queries/list-pending-work-requests';
export {getRelatedByTags} from './queries/get-related-by-tags';
export {getRelatedByVector} from './queries/get-related-by-vector';
export {getTagNeighborhood, type TagNeighbor} from './queries/get-tag-neighborhood';
export {
  listLinksNeedingEmbedding,
  type LinkForEmbedding,
} from './queries/list-links-needing-embedding';
export {
  scoreQueuedBySimilarity,
  type QueueSimilarityScore,
} from './queries/score-queued-by-similarity';
export {
  upsertLinkEmbedding,
  type UpsertLinkEmbeddingInput,
} from './commands/upsert-link-embedding';

// commands
export {createLink} from './commands/create-link';
export {deleteLink} from './commands/delete-link';
export {deleteLinks} from './commands/delete-links';
export {updateLink} from './commands/update-link';
export {mergeTag} from './commands/merge-tag';
export {renameTag} from './commands/rename-tag';
export {deleteTag} from './commands/delete-tag';
export {markTagNormalized} from './commands/normalize-tag';
export {resetEnrichment} from './commands/reset-enrichment';
export {setSetting} from './commands/set-setting';
export {createFeed} from './commands/create-feed';
export {updateFeed} from './commands/update-feed';
export {deleteFeed} from './commands/delete-feed';
export {createRssItem} from './commands/create-rss-item';
export {markRssItemRead} from './commands/mark-rss-item-read';
export {promoteRssItem} from './commands/promote-rss-item';
export {bulkUpsertRssItems} from './commands/bulk-upsert-rss-items';
export {bulkUpsertEmailItems} from './commands/bulk-upsert-email-items';
export {createEmailItem} from './commands/create-email-item';
export {markEmailItemRead} from './commands/mark-email-item-read';
export {markAllEmailItemsRead} from './commands/mark-all-email-items-read';
export {promoteEmailItem} from './commands/promote-email-item';
export {setGmailTokens} from './commands/set-gmail-tokens';
export {setGmailFilter} from './commands/set-gmail-filter';
export {clearGmailAuthTokens, clearGmailTokens} from './commands/clear-gmail-tokens';
export {createWorkRequest} from './commands/create-work-request';
export {markWorkRequestProcessing} from './commands/mark-work-request-processing';
export {markWorkRequestCompleted} from './commands/mark-work-request-completed';
export {markWorkRequestFailed} from './commands/mark-work-request-failed';
export {cleanupOldWorkRequests} from './commands/cleanup-old-work-requests';

// lib
export {normalizeTag} from './lib/normalize-tag';
export {validateSettingValue} from './lib/setting-schemas';
export {loadKey, encryptToken, decryptToken} from './lib/crypto';

// types
export type {
  LinkWithTags,
  ListLinksParams,
  ListLinksResult,
  ListTagsParams,
  ListTagsResult,
  RelatedLink,
  TagWithCount,
  TagSimple,
  CreateLinkInput,
  UpdateLinkInput,
  MergeTagInput,
  RenameTagInput,
  SettingResponse,
  Feed,
  CreateFeedInput,
  UpdateFeedInput,
  RssItem,
  CreateRssItemInput,
  ListRssItemsParams,
  ListRssItemsResult,
  RssItemWithFeed,
  ListAllRssItemsParams,
  ListAllRssItemsResult,
  EmailItem,
  CreateEmailItemInput,
  ListEmailItemsParams,
  ListEmailItemsResult,
  GmailTokens,
  WorkRequest,
  WorkRequestType,
  CreateWorkRequestInput,
} from './types';
export type {LinkStatus} from './queries/get-tags-with-count';
export type {StatusSummary, StatusBucket, FailingFeed} from './queries/get-status';
