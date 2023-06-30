import {Link} from '@remix-run/react';
import type {TagListItem} from '~/Types';

interface Props {
  title: string;
  items: TagListItem[];
}

export function TagList({title, items}: Props) {
  return (
    <div className="flex flex-col items-center flex-grow">
      <h2 className="font-bold mb-2 text-center">{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`?query=${item.text}`} className="flex items-center">
              <div className={`bg-${item.color} rounded-full h-[10px] w-[10px] mr-5`}></div>
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
