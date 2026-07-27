const BUTTONDOWN_PATTERN = /^https?:\/\/buttondown(?:-\d+)?\.com\/c\/([A-Za-z0-9+\/=_-]+)$/;

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'mc_cid',
  'mc_eid',
];

/**
 * Buttondown wraps the real destination in a base64 payload of the form
 * `<id>|<something>|<url>`. Decoding it is what keeps the same article from
 * counting twice when it arrives via both a newsletter and an RSS feed.
 */
function decodeButtondownUrl(url: string): string | null {
  const match = url.match(BUTTONDOWN_PATTERN);
  if (!match) return null;

  try {
    const encoded = match[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(encoded);
    const parts = decoded.split('|');
    if (parts.length >= 3) {
      const actualUrl = parts[2];
      new URL(actualUrl); // validate
      return actualUrl;
    }
  } catch {
    return null;
  }
  return null;
}

function unwrapTrackingUrl(url: string): string {
  const decoded = decodeButtondownUrl(url);
  return decoded ?? url;
}

function stripTrackingParams(url: string): string {
  try {
    const parsed = new URL(url);
    TRACKING_PARAMS.forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Canonical form of a link, used both when ingesting newsletter links and when
 * deduping a digest window. Two URLs that normalize to the same string are the
 * same article as far as schwankie is concerned.
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  normalized = unwrapTrackingUrl(normalized);
  normalized = stripTrackingParams(normalized);
  normalized = normalized.replace(/\/$/, '');
  return normalized;
}
