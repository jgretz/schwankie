import {Link} from '@remix-run/react';
import type {LinkSearchResponseItem} from '~/Types';
import {appendParams} from '~/services/util/appendParams';

interface Props {
  link: LinkSearchResponseItem;
}

interface TagProps {
  text: string;
  displayComma: boolean;
}

function CardTag({text, displayComma}: TagProps) {
  const linkTo = appendParams('/?', [['query', text]]);

  return (
    <Link to={linkTo}>
      {text}
      {displayComma && <span>,&nbsp;</span>}
    </Link>
  );
}

export function CardTags({link}: Props) {
  const {link_tag} = link;

  return (
    <div className="line-clamp-1">
      {link_tag.map(({tag}, index) => (
        <CardTag key={tag.id} text={tag.text} displayComma={index < link_tag.length - 1} />
      ))}
    </div>
  );
}
