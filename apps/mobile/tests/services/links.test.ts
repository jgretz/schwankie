import {describe, it, expect, beforeEach, beforeAll, mock} from 'bun:test';
import {InfiniteData, QueryClient} from '@tanstack/react-query';
import type {LinksResponse} from 'client';
import {makeInfiniteData, makeLink, makePage} from '../factories';

// react-native-toast-message pulls in react-native, which cannot load under
// bun test — stub it before importing the module under test.
mock.module('react-native-toast-message', () => ({
  default: {show: () => {}},
}));

type Mod = typeof import('../../src/services/links');
let updateLinkMutationOptions: Mod['updateLinkMutationOptions'];
let deleteLinkMutationOptions: Mod['deleteLinkMutationOptions'];

beforeAll(async () => {
  const mod = await import('../../src/services/links');
  updateLinkMutationOptions = mod.updateLinkMutationOptions;
  deleteLinkMutationOptions = mod.deleteLinkMutationOptions;
});

const QUEUED_KEY = ['links', 'queued', {}];

function ids(data: InfiniteData<LinksResponse> | undefined): number[] {
  return (data?.pages ?? []).flatMap((page) => page.items.map((item) => item.id));
}

// react-query v5.90 passes a MutationFunctionContext as the trailing arg to
// every mutation callback.
function fnContext(queryClient: QueryClient) {
  return {client: queryClient, meta: undefined};
}

describe('updateLinkMutationOptions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it('should optimistically remove the promoted row from the queued list', async () => {
    const seeded = makeInfiniteData([
      makePage({items: [makeLink({id: 1}), makeLink({id: 2}), makeLink({id: 3})]}),
    ]);
    queryClient.setQueryData(QUEUED_KEY, seeded);

    const options = updateLinkMutationOptions(queryClient);
    await options.onMutate!({id: 2, data: {status: 'saved'}}, fnContext(queryClient));

    const after = queryClient.getQueryData<InfiniteData<LinksResponse>>(QUEUED_KEY);
    expect(ids(after)).toEqual([1, 3]);
  });

  it('should restore the snapshot on error (rollback)', async () => {
    const seeded = makeInfiniteData([makePage({items: [makeLink({id: 1}), makeLink({id: 2})]})]);
    queryClient.setQueryData(QUEUED_KEY, seeded);

    const options = updateLinkMutationOptions(queryClient);
    const context = await options.onMutate!(
      {id: 2, data: {status: 'saved'}},
      fnContext(queryClient),
    );

    // Sanity: the optimistic edit happened.
    expect(ids(queryClient.getQueryData(QUEUED_KEY))).toEqual([1]);

    options.onError!(
      new Error('boom'),
      {id: 2, data: {status: 'saved'}},
      context,
      fnContext(queryClient),
    );

    expect(ids(queryClient.getQueryData(QUEUED_KEY))).toEqual([1, 2]);
  });

  it('should skip the optimistic edit for non-status updates', async () => {
    const seeded = makeInfiniteData([makePage({items: [makeLink({id: 1}), makeLink({id: 2})]})]);
    queryClient.setQueryData(QUEUED_KEY, seeded);

    const options = updateLinkMutationOptions(queryClient);
    const context = await options.onMutate!(
      {id: 1, data: {title: 'Renamed'}},
      fnContext(queryClient),
    );

    expect(context).toBeUndefined();
    expect(ids(queryClient.getQueryData(QUEUED_KEY))).toEqual([1, 2]);
  });
});

describe('deleteLinkMutationOptions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it('should optimistically remove the deleted row from the queued list', async () => {
    const seeded = makeInfiniteData([
      makePage({items: [makeLink({id: 1}), makeLink({id: 2}), makeLink({id: 3})]}),
    ]);
    queryClient.setQueryData(QUEUED_KEY, seeded);

    const options = deleteLinkMutationOptions(queryClient);
    await options.onMutate!(3, fnContext(queryClient));

    expect(ids(queryClient.getQueryData(QUEUED_KEY))).toEqual([1, 2]);
  });

  it('should restore the snapshot on error (rollback)', async () => {
    const seeded = makeInfiniteData([makePage({items: [makeLink({id: 1}), makeLink({id: 2})]})]);
    queryClient.setQueryData(QUEUED_KEY, seeded);

    const options = deleteLinkMutationOptions(queryClient);
    const context = await options.onMutate!(1, fnContext(queryClient));

    expect(ids(queryClient.getQueryData(QUEUED_KEY))).toEqual([2]);

    options.onError!(new Error('boom'), 1, context, fnContext(queryClient));

    expect(ids(queryClient.getQueryData(QUEUED_KEY))).toEqual([1, 2]);
  });

  it('should leave other rows and pages intact when removing one item', async () => {
    const seeded = makeInfiniteData([
      makePage({items: [makeLink({id: 1}), makeLink({id: 2})], hasMore: true, nextOffset: 25}),
      makePage({items: [makeLink({id: 3}), makeLink({id: 4})]}),
    ]);
    queryClient.setQueryData(QUEUED_KEY, seeded);

    const options = deleteLinkMutationOptions(queryClient);
    await options.onMutate!(2, fnContext(queryClient));

    const after = queryClient.getQueryData<InfiniteData<LinksResponse>>(QUEUED_KEY);
    expect(after!.pages).toHaveLength(2);
    expect(ids(after)).toEqual([1, 3, 4]);
    expect(after!.pages[0]!.hasMore).toBe(true);
    expect(after!.pages[0]!.nextOffset).toBe(25);
  });
});
