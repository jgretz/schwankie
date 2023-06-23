import {TAGS_BASE_URL} from '~/constants';
import type {TagListItem, TopTagsResponsItem} from '../../Types';
import {colorForTag} from '../util/colorForTag';

export async function loadTopTags(): Promise<TagListItem[]> {
  const URL = `${TAGS_BASE_URL}/top`;

  const response = await fetch(URL, {
    headers: {
      api_key: process.env.API_KEY || '',
    },
  });

  if (response.status !== 200) {
    console.warn('Unable to get top tags');
    return [];
  }

  const items = (await response.json()) as TopTagsResponsItem[];

  return items.map((item) => ({
    id: item.id,
    text: item.text,
    color: colorForTag(item.text),
    support: item._count.link_tag.toString(),
  }));
}
