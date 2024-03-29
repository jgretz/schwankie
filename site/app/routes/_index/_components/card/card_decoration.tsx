import {useMemo} from 'react';
import type {LinkSearchResponseItem} from '~/Types';
import {colorForTags} from '~/services/util/colorForTag';

interface Props {
  link: LinkSearchResponseItem;
}

function determineBgColor(link: LinkSearchResponseItem) {
  const tags = link.link_tag.map(({tag}) => tag.text);
  const color = colorForTags(tags);

  return `bg-${color}`;
}

export function CardDecoration({link}: Props) {
  const bgColor = useMemo(() => determineBgColor(link), [link]);

  return <div className={`w-[15px] min-w-[15px] rounded-r-lg ${bgColor}`}></div>;
}
