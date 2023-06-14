import {Link} from '@remix-run/react';
import type {LinkSearchResponseItem} from '~/Types';

interface Props {
  link: LinkSearchResponseItem;
}

interface TagProps {
  text: string;
  displayComma: boolean;
}

function LinkTag({text, displayComma}: TagProps) {
  return (
    <Link to={`/${text}`}>
      <span>{text}</span>
      {displayComma && <span>,&nbsp;</span>}
    </Link>
  );
}

export function LinkTags({link}: Props) {
  const {link_tag} = link;

  return (
    <div className="flex flex-row">
      {link_tag.map(({tag}, index) => (
        <LinkTag key={tag.id} text={tag.text} displayComma={index < link_tag.length - 1} />
      ))}
    </div>
  );
}
