import type {LinkSearchResponseItem} from '~/Types';
import {Card} from './card';

interface Props {
  links: LinkSearchResponseItem[];
}

export function CardList({links}: Props) {
  return (
    <div className="flex flex-col justify-start items-center mx-auto w-3/4">
      {links.map((link) => (
        <Card key={link.id} link={link} />
      ))}
    </div>
  );
}
