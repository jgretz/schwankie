import {DomainValidationError} from './errors';

// Source of truth: packages/database/schema/link.schema.ts. The source tables
// (rss_item, email_item) are unbounded `text`, so anything copied into `link`
// has to be fitted first or Postgres raises SQLSTATE 22001 and aborts the
// transaction.
const MAX_URL = 2048;
const MAX_TITLE = 500;
const MAX_DESCRIPTION = 800;
const MAX_IMAGE_URL = 2048;

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
  const urlLength = countCodePoints(url);
  if (urlLength > MAX_URL) {
    throw new DomainValidationError(
      'url',
      `url exceeds the maximum of ${MAX_URL} characters (got ${urlLength})`,
    );
  }

  // Blank is treated as absent throughout: `title` is NOT NULL so it falls back
  // to the url, and the nullable columns drop out of the insert entirely.
  const title = truncate(input.title?.trim() || url, MAX_TITLE);

  const rawDescription = input.description?.trim();
  const description = rawDescription ? truncate(rawDescription, MAX_DESCRIPTION) : undefined;

  const rawImageUrl = input.imageUrl?.trim();
  const imageUrl =
    rawImageUrl && countCodePoints(rawImageUrl) <= MAX_IMAGE_URL ? rawImageUrl : undefined;

  return {url, title, description, imageUrl};
}
