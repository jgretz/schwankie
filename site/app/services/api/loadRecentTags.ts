import {TAGS_BASE_URL} from '~/constants';
import type {RecentTagsResponseItem, TagListItem} from '../../Types';
import {colorForTag} from '../util/colorForTag';

export async function loadRecentTags(): Promise<TagListItem[]> {
  const URL = `${TAGS_BASE_URL}/recent`;

  const response = await fetch(URL, {
    headers: {
      api_key: process.env.API_KEY || '',
    },
  });

  if (response.status !== 200) {
    console.warn('Unable to get recent tags');
    return [];
  }

  const items = (await response.json()) as RecentTagsResponseItem[];

  return items.map(({tag}) => ({
    id: tag.id,
    text: tag.text,
    color: colorForTag(tag.text),
    support: '',
  }));
}
