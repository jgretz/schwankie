import {DomainValidationError} from './errors';

// Source of truth: packages/database/schema/link.schema.ts. The source tables
// (rss_item, email_item) are unbounded `text`, so anything copied into `link`
// has to be fitted first or Postgres raises SQLSTATE 22001 and aborts the
// transaction.
const MAX_URL = 2048;
const MAX_TITLE = 500;
const MAX_DESCRIPTION = 800;

const ELLIPSIS = '…';

export type FitLinkFieldsInput = {
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
};

export type FitLinkFieldsOutput = {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
};

// Postgres `varchar(n)` counts characters, not UTF-16 code units. Working in
// code points keeps astral characters (emoji, CJK extension) counted as one and
// never leaves a lone surrogate half at the cut.
function countCodePoints(value: string): number {
  return Array.from(value).length;
}

function truncate(value: string, max: number): string {
  const points = Array.from(value);
  if (points.length <= max) return value;
  return points.slice(0, max - 1).join('') + ELLIPSIS;
}

/**
 * Fit candidate link fields to the bounded `link` columns.
 *
 * URLs are never truncated — a truncated URL is a wrong URL — so an over-long
 * one is rejected. An over-long image URL is dropped instead, since the column
 * is nullable and a broken image is worse than no image.
 */
export function fitLinkFields(input: FitLinkFieldsInput): FitLinkFieldsOutput {
  const url = input.url;
  if (countCodePoints(url) > MAX_URL) {
    throw new DomainValidationError(
      'url',
      `url exceeds the maximum of ${MAX_URL} characters (got ${countCodePoints(url)})`,
    );
  }

  // `title` is NOT NULL, so an absent or whitespace-only one falls back to the url.
  const rawTitle = input.title?.trim() ? input.title : url;
  const title = truncate(rawTitle, MAX_TITLE);

  const description = input.description ? truncate(input.description, MAX_DESCRIPTION) : undefined;

  const imageUrl =
    input.imageUrl && countCodePoints(input.imageUrl) <= MAX_URL ? input.imageUrl : undefined;

  return {url, title, description, imageUrl};
}
