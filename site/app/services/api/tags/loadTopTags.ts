import {URLS} from '~/constants/urls';
import type {TagListItem, TopTagsResponsItem} from '~/Types';
import {colorForTag} from '~/services/util/colorForTag';

export async function loadTopTags(): Promise<TagListItem[]> {
  const URL = `${URLS.TAGS}/top`;

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
