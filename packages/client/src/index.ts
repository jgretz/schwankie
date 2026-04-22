export {init} from './config';

// calls
export {fetchLinks} from './calls/fetch-links';
export {fetchTags} from './calls/fetch-tags';
export {getLink} from './calls/get-link';
export {createLink} from './calls/create-link';
export {updateLink} from './calls/update-link';
export {deleteLink} from './calls/delete-link';
export {fetchMetadata} from './calls/fetch-metadata';
export {getLinksNeedingEnrichment} from './calls/get-links-needing-enrichment';
export {updateLinkContent} from './calls/update-link-content';
export {getLinksNeedingScoring} from './calls/get-links-needing-scoring';
export {updateLinkScore} from './calls/update-link-score';
export {getTagsNeedingNormalization} from './calls/get-tags-needing-normalization';
export {getCanonicalTags} from './calls/get-canonical-tags';
export {mergeTag} from './calls/merge-tag';
export {renameTag} from './calls/rename-tag';
export {deleteTag} from './calls/delete-tag';
export {markTagNormalized} from './calls/mark-tag-normalized';
export {reportEnrichmentFailure} from './calls/report-enrichment-failure';
export {resetEnrichment} from './calls/reset-enrichment';
export {fetchDeadLinks} from './calls/fetch-dead-links';
export {refetchLink} from './calls/refetch-link';
export {suggestTags} from './calls/suggest-tags';
export {getSetting} from './calls/get-setting';
export {setSetting} from './calls/set-setting';
export {getGmailAuthUrl} from './calls/get-gmail-auth-url';
export {exchangeGmailCode} from './calls/exchange-gmail-code';
export {disconnectGmail} from './calls/disconnect-gmail';
export {getGmailStatus} from './calls/get-gmail-status';
export {setGmailFilter} from './calls/set-gmail-filter';
export {getGmailTokens} from './calls/get-gmail-tokens';

// types
export type {
  LinkStatus,
  LinkData,
  LinksResponse,
  TagsResponse,
  LinkMetadata,
  CreateLinkInput,
  UpdateLinkInput,
  SettingResponse,
  GmailAuthUrlResponse,
  GmailConnectResponse,
  GmailStatusResponse,
  GmailTokensResponse,
} from './types';
