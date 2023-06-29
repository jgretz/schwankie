import type {LinkSearchResponseItem} from '~/Types';
import {CardTags} from './card_tags';

interface Props {
  link: LinkSearchResponseItem;
}

export function CardText({link}: Props) {
  return (
    <div className="m-5 flex flex-col flex-grow">
      <div className="flex-grow line-clamp-3 font-bold text-lg">
        <a href={link.url} target="_blank" rel="noreferrer">
          {link.title}
        </a>
      </div>
      <CardTags link={link} />
    </div>
  );
}
