import type {RssFeedItem} from 'rss';
import {FeedItemCard} from './feed-item-card';

export function FeedList({feedItems}: {feedItems: RssFeedItem[]}) {
  return (
    <div>
      <ul>
        {feedItems.map((item) => (
          <FeedItemCard key={item.guid} item={item} />
        ))}
      </ul>
    </div>
  );
}
