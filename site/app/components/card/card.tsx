import type {LinkSearchResponseItem} from '~/Types';
import {LinkImage} from './link_image';
import {LinkDecoration} from './link_decoration';
import {LinkText} from './link_text';

interface Props {
  link: LinkSearchResponseItem;
}

export function Card({link}: Props) {
  return (
    <div className="w-full bg-fore_black rounded-lg mt-4 shadow-xl flex flex-row">
      <LinkImage link={link} />
      <LinkText link={link} />
      <LinkDecoration link={link} />
    </div>
  );
}
