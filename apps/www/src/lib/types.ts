import type {TagsResponse} from 'client';

/**
 * Derived from the API response rather than hand-written so the admin tag
 * helpers, rows and dialogs cannot drift from the shape the server actually
 * returns.
 */
export type TagItem = TagsResponse['tags'][number];
