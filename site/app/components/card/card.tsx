import type {LinkSearchResponseItem} from '~/Types';
import {CardImage} from './card_image';
import {CardDecoration} from './card_decoration';
import {CardText} from './card_text';

interface Props {
  link: LinkSearchResponseItem;
}

export function Card({link}: Props) {
  return (
    <div className="w-full bg-fore_black rounded-lg mt-5 mx-5 shadow-xl flex flex-row justify-between">
      <CardImage link={link} />
      <CardText link={link} />
      <CardDecoration link={link} />
    </div>
  );
}
