import type {LinkSearchResponseItem} from '~/Types';
import {CardTags} from './card_tags';

interface Props {
  link: LinkSearchResponseItem;
}

export function CardText({link}: Props) {
  return (
    <div className="m-5 flex flex-col flex-grow">
      <div className="flex-grow font-bold text-lg line-clamp-3">
        <a href={link.url} target="_blank" rel="noreferrer">
          {link.title}
        </a>
      </div>
      <CardTags link={link} />
    </div>
  );
}
