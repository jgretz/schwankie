import {normalizeUrl} from './normalize-url';

/**
 * Noise filtering for a digest window. This is deliberately server-side and
 * unit-tested rather than delegated to the clustering prompt: what counts as
 * filler is a stable, checkable rule, and paying an LLM to re-derive it every
 * morning is both slower and non-deterministic. On a sample week these rules
 * removed roughly 230 of 1,855 items.
 */

/**
 * Daily puzzle posts — the same handful of feeds emit one every single day.
 * Names like "Connections" and "Strands" are ordinary English, so they only
 * count as puzzles alongside a puzzle word; matching them bare drops real
 * articles ("the connections between rate cuts and housing").
 */
const PUZZLE_NAMES_UNAMBIGUOUS = [/\bwordle\b/i, /\bquordle\b/i, /\bnyt mini\b/i];

const PUZZLE_NAMES_AMBIGUOUS = [/\bconnections\b/i, /\bstrands\b/i, /\bcrossword\b/i];

const PUZZLE_CONTEXT = /\b(hints?|answers?|clues?|puzzles?|spangram|themes?)\b/i;

/** Retail/deal copy, which reads as news but never belongs in a digest. */
const DEAL_PATTERNS = [
  /\bsave \$/i,
  /\d+% off\b/i,
  /\bblack friday\b/i,
  /\bcyber monday\b/i,
  /\bbest deals?\b/i,
  /\bdeal of the day\b/i,
];

/**
 * Deal-roundup slugs, e.g. Mashable's `/july-27-deals` or `/deals/july-27`.
 * Matched on the path so a headline merely mentioning a month is unaffected.
 */
const DEAL_SLUG =
  /\/(?:january|february|march|april|may|june|july|august|september|october|november|december)-\d{1,2}[-/]/i;

export function isPuzzleTitle(title: string): boolean {
  if (PUZZLE_NAMES_UNAMBIGUOUS.some((pattern) => pattern.test(title))) return true;
  if (/\bnyt\b/i.test(title) && PUZZLE_NAMES_AMBIGUOUS.some((p) => p.test(title))) return true;
  return PUZZLE_NAMES_AMBIGUOUS.some((p) => p.test(title)) && PUZZLE_CONTEXT.test(title);
}

export function isDealTitle(title: string): boolean {
  return DEAL_PATTERNS.some((pattern) => pattern.test(title));
}

export function isDealUrl(url: string): boolean {
  return DEAL_SLUG.test(url) || /\/deals?\//i.test(url);
}

/** True when an item is filler rather than something worth clustering. */
export function isFiller(item: {title: string; url: string}): boolean {
  return isPuzzleTitle(item.title) || isDealTitle(item.title) || isDealUrl(item.url);
}

/**
 * Collapse items that point at the same article. Keeps the FIRST occurrence,
 * so callers should pass items in the order they want preferred (newest first).
 * This is what kills the Hacker News / "HN: Newest" double-listing.
 */
export function dedupeByUrl<T extends {url: string}>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(function (item) {
    const key = normalizeUrl(item.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The full noise pass: drop filler, then collapse duplicate URLs. */
export function filterDigestItems<T extends {title: string; url: string}>(items: T[]): T[] {
  return dedupeByUrl(items.filter((item) => !isFiller(item)));
}
