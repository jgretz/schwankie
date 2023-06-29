import {json, type LoaderArgs} from '@remix-run/node';
import {loadLinks} from '~/services';
import {Card} from '~/components/card/card';
import {useFetcher, useSearchParams} from '@remix-run/react';
import {useResourceRouteFetcher} from '~/hooks/useResourceRouteFetcher';
import {parseSearchParams} from '~/services/util/parseSearchParams';
import {appendParams} from '~/services/util/appendParams';

const ROUTE = '/resources/link_list?';

export async function loader({request}: LoaderArgs) {
  const url = new URL(request.url);
  const params = parseSearchParams(url.searchParams);

  const links = await loadLinks(params);

  return json({links});
}

export function LinkList() {
  const linkFetcher = useFetcher<typeof loader>();
  const links = linkFetcher.data?.links || [];

  const [searchParams] = useSearchParams();
  const {query, size} = parseSearchParams(searchParams);
  const URL = appendParams(ROUTE, [
    ['query', query],
    ['size', size],
  ]);

  useResourceRouteFetcher<typeof loader>(linkFetcher, URL);

  return (
    <div className="flex flex-col justify-start items-center mx-auto w-3/4">
      {links.map((link) => (
        <Card key={link.id} link={link} />
      ))}
    </div>
  );
}
