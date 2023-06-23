import {TagListItem} from '~/Types';
import {colorForTag} from '../util/colorForTag';

const mainTags = ['food', 'tech', 'business', 'sports'];

export async function loadMainTags(): Promise<TagListItem[]> {
  return mainTags.map((t, i) => ({
    id: i,
    text: t,
    color: colorForTag(t),
    support: '',
  }));
}
