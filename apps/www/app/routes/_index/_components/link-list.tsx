import type {Links} from 'domain/schwankie';
import {LinkItem} from './link-item';

interface Props {
  links: Links;
}

export function LinkList({links}: Props) {
  return (
    <ul className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {links.map((link) => (
        <LinkItem key={link.id} link={link} />
      ))}
    </ul>
  );
}
