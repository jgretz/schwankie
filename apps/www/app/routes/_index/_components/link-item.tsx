import type {Link} from 'domain/schwankie';
import LinkImage from './link-image';
import {format} from 'date-fns';
import {useCallback} from 'react';

interface Props {
  link: Link;
}

function LinkTag({tag, comma = true}: {tag: string; comma: boolean}) {
  // remix didnt refresh with a standard link, not sure why, but also this avoids using a rel=nofollow
  const handleClick = useCallback(() => {
    window.location.href = `?query=${tag}`;
  }, [tag]);

  return (
    <span key={tag} className="text-sm cursor-pointer" onClick={handleClick}>
      {tag}
      {comma && ', '}
    </span>
  );
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
        <div>
          {link.tags?.map((tag, index) => (
            <LinkTag key={tag} tag={tag} comma={index < (link.tags?.length || 0) - 1} />
          ))}
        </div>
        <div className="text-sm">
          Last Updated: {format(new Date(link.updateDate), 'MMM dd, yyyy')}
        </div>
      </div>
    </li>
  );
}
