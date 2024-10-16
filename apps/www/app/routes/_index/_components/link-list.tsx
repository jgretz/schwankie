import type {Links} from 'schwankie-domain';
import {LinkItem} from './link-item';

interface Props {
  links: Links;
}

export function LinkList({links}: Props) {
  return (
    <ul>
      {links.map((link) => (
        <LinkItem key={link.id} link={link} />
      ))}
    </ul>
  );
}
