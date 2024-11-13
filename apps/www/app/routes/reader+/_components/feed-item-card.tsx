import {formatDistanceToNow} from 'date-fns';
import type {RssFeedItem} from 'rss';

function formatPubDate(pubDate: string) {
  try {
    return formatDistanceToNow(pubDate, {addSuffix: true});
  } catch (error) {
    return '';
  }
}

export function FeedItemCard({item}: {item: RssFeedItem}) {
  const image = item.image ? (
    <img
      src={item.image}
      className="object-cover h-[78px] w-[130px] rounded-md"
      height={78}
      width={130}
    />
  ) : null;

  return (
    <li className="flex flex-row m-5">
      <div className="h-[78px] w-[130px] min-h-[78px] min-w-[130px] mr-3 rounded-md">{image}</div>
      <div className="flex flex-col p-3 bg-accent rounded-md w-full">
        <a href={item.link} target="__blank">
          <h2 className="font-bold text-lg text-text">{item.title}</h2>
        </a>
        <div>
          <span className="font-light text-sm italic">
            {item.feed} / {formatPubDate(item.pubDate)}
          </span>
        </div>
        <div className="text-sm mt-1 line-clamp-3">{item.summary}</div>
      </div>
    </li>
  );
}
