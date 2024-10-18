import type {Link} from 'schwankie-domain';
import LinkImage from './link-image';
import {format} from 'date-fns';

interface Props {
  link: Link;
}

export function LinkItem({link}: Props) {
  return (
    <li className="flex flex-col bg-accent shadow-md border-1 rounded overflow-hidden p-2">
      <div>
        <LinkImage src={link.imageUrl} url={link.url} className="float-start" />
        <a href={link.url} target="_blank" rel="noreferrer">
          <h2 className="font-bold text-md">{link.title}</h2>
        </a>
      </div>
      <div>
        <div></div>
        <div className="text-sm">
          Last Updated: {format(new Date(link.updateDate), 'MMM dd, yyyy')}
        </div>
      </div>
    </li>
  );
}
