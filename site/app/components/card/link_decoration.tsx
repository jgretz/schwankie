import {useMemo} from 'react';
import type {LinkSearchResponseItem} from '~/Types';
import {colorForTags} from '~/services';

interface Props {
  link: LinkSearchResponseItem;
}

function determineBgColor(link: LinkSearchResponseItem) {
  const tags = link.link_tag.map(({tag}) => tag.text);
  const color = colorForTags(tags);

  return `bg-${color}`;
}

export function LinkDecoration({link}: Props) {
  const bgColor = useMemo(() => determineBgColor(link), [link]);

  return <div className={`flex flex-row min-w-[15px] rounded-r-lg ${bgColor}`}></div>;
}
