import type {SerializeFrom} from '@remix-run/node';
import type {FetcherWithComponents} from '@remix-run/react';
import {useEffect, useState} from 'react';

export function useResourceRouteFetcher<T>(
  fetcher: FetcherWithComponents<SerializeFrom<T>>,
  resourceRoute: string,
) {
  const [resourceLoaded, setResourceLoaded] = useState('');

  useEffect(() => {
    if (resourceRoute !== resourceLoaded) {
      fetcher.load(resourceRoute);
      setResourceLoaded(resourceRoute);
    }
  }, [fetcher, resourceLoaded, resourceRoute]);
}
