import type {ParseRssItem} from '../Types';

function isHTML(str: string): boolean {
  try {
    new DOMParser().parseFromString(str, 'text/html');

    return true;
  } catch (error) {
    return false;
  }
}

export function parseRssItemSummary(item: ParseRssItem) {
  const summary = item.description ?? item.summary;
  if (summary) {
    return summary;
  }

  if (item.contentSnippet && !isHTML(item.contentSnippet)) {
    return item.contentSnippet;
  }

  if (item.content && !isHTML(item.content)) {
    return item.content;
  }

  return undefined;
}
