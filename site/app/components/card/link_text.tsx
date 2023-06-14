import type {LinkSearchResponseItem} from '~/Types';
import {LinkTags} from './link_tags';

interface Props {
  link: LinkSearchResponseItem;
}

export function LinkText({link}: Props) {
  return (
    <div className="m-5 flex flex-col flex-grow">
      <div className="flex-grow line-clamp-3 font-bold text-lg">
        <a href={link.url} target="_blank" rel="noreferrer">
          {link.title}
        </a>
      </div>
      <LinkTags link={link} />
    </div>
  );
}
