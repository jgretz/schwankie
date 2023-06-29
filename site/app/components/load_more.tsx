import {Link, useSearchParams} from '@remix-run/react';
import {appendParams} from '~/services/util/appendParams';
import {parseSearchParams} from '~/services/util/parseSearchParams';

export function LoadMore() {
  const [searchParams] = useSearchParams();
  const {query, size} = parseSearchParams(searchParams);

  const linkTo = appendParams('/?', [
    ['query', query],
    ['size', size || 25 + 25],
  ]);

  return (
    <div className="w-full flex items-center justify-center my-5">
      <Link to={linkTo} className="text-2xl">
        Load More
      </Link>
    </div>
  );
}
