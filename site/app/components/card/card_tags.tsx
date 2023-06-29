import {Link} from '@remix-run/react';
import type {LinkSearchResponseItem} from '~/Types';

interface Props {
  link: LinkSearchResponseItem;
}

interface TagProps {
  text: string;
  displayComma: boolean;
}

function CardTag({text, displayComma}: TagProps) {
  return (
    <Link to={`?query=${text}`}>
      <span>{text}</span>
      {displayComma && <span>,&nbsp;</span>}
    </Link>
  );
}

export function CardTags({link}: Props) {
  const {link_tag} = link;

  return (
    <div className="flex flex-row">
      {link_tag.map(({tag}, index) => (
        <CardTag key={tag.id} text={tag.text} displayComma={index < link_tag.length - 1} />
      ))}
    </div>
  );
}
