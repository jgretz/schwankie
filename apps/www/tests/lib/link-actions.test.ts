import {beforeAll, describe, expect, it, mock} from 'bun:test';

mock.module('@tanstack/react-start', () => ({
  createServerFn: () => ({
    inputValidator: () => ({
      handler: (fn: Function) => fn,
    }),
  }),
}));

mock.module('../../src/lib/session.server', () => ({
  getSession: mock(async () => ({authenticated: true})),
}));

mock.module('../../src/lib/init-client.server', () => ({
  initClientServer: mock(() => {}),
}));

mock.module('client', () => ({
  fetchMetadata: mock(async (url: string) => ({url, title: 'Test Title'})),
  createLink: mock(async (data: any) => ({id: 1, ...data})),
  updateLink: mock(async (id: number, data: any) => ({id, ...data})),
  resetEnrichment: mock(async (id: number) => ({id, reset: true})),
  refetchLink: mock(async (id: number) => ({id, refetched: true})),
  suggestTags: mock(async (id: number) => [{id, tag: 'suggested'}]),
  deleteLink: mock(async (id: number) => ({id, deleted: true})),
}));

let fetchMetadataAction: any;
let createLinkAction: any;
let updateLinkAction: any;
let resetEnrichmentAction: any;
let refetchLinkAction: any;
let suggestTagsAction: any;
let deleteLinkAction: any;
let mockGetSession: any;
let mockFetchMetadata: any;
let mockCreateLink: any;
let mockUpdateLink: any;
let mockResetEnrichment: any;
let mockRefetchLink: any;
let mockSuggestTags: any;
let mockDeleteLink: any;

beforeAll(async function () {
  const mod = await import('../../src/lib/link-actions');
  fetchMetadataAction = mod.fetchMetadataAction;
  createLinkAction = mod.createLinkAction;
  updateLinkAction = mod.updateLinkAction;
  resetEnrichmentAction = mod.resetEnrichmentAction;
  refetchLinkAction = mod.refetchLinkAction;
  suggestTagsAction = mod.suggestTagsAction;
  deleteLinkAction = mod.deleteLinkAction;

  const sessionMod = await import('../../src/lib/session.server');
  mockGetSession = sessionMod.getSession;

  const clientMod = await import('client');
  mockFetchMetadata = clientMod.fetchMetadata;
  mockCreateLink = clientMod.createLink;
  mockUpdateLink = clientMod.updateLink;
  mockResetEnrichment = clientMod.resetEnrichment;
  mockRefetchLink = clientMod.refetchLink;
  mockSuggestTags = clientMod.suggestTags;
  mockDeleteLink = clientMod.deleteLink;
});

describe('fetchMetadataAction', function () {
  it('should call fetchMetadata with url', async function () {
    mockFetchMetadata.mockClear();
    const result = await fetchMetadataAction({data: {url: 'https://example.com'}});
    expect(mockFetchMetadata).toHaveBeenCalledWith('https://example.com');
    expect(result).toEqual({url: 'https://example.com', title: 'Test Title'});
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await fetchMetadataAction({data: {url: 'https://example.com'}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});

describe('createLinkAction', function () {
  it('should call createLink with data', async function () {
    mockCreateLink.mockClear();
    const input = {url: 'https://example.com', title: 'Test', tags: ['tag1']};
    const result = await createLinkAction({data: input});
    expect(mockCreateLink).toHaveBeenCalledWith(input);
    expect(result.id).toBe(1);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await createLinkAction({data: {url: 'https://example.com', title: 'Test'}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});

describe('updateLinkAction', function () {
  it('should call updateLink with id and rest of data', async function () {
    mockUpdateLink.mockClear();
    const input = {id: 1, title: 'Updated', tags: ['tag2']};
    const result = await updateLinkAction({data: input});
    expect(mockUpdateLink).toHaveBeenCalledWith(1, {title: 'Updated', tags: ['tag2']});
    expect(result.id).toBe(1);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await updateLinkAction({data: {id: 1, title: 'Updated'}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});

describe('resetEnrichmentAction', function () {
  it('should call resetEnrichment with id', async function () {
    mockResetEnrichment.mockClear();
    const result = await resetEnrichmentAction({data: {id: 1}});
    expect(mockResetEnrichment).toHaveBeenCalledWith(1);
    expect(result.reset).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await resetEnrichmentAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});

describe('refetchLinkAction', function () {
  it('should call refetchLink with id', async function () {
    mockRefetchLink.mockClear();
    const result = await refetchLinkAction({data: {id: 1}});
    expect(mockRefetchLink).toHaveBeenCalledWith(1);
    expect(result.refetched).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await refetchLinkAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});

describe('suggestTagsAction', function () {
  it('should call suggestTags with id', async function () {
    mockSuggestTags.mockClear();
    const result = await suggestTagsAction({data: {id: 1}});
    expect(mockSuggestTags).toHaveBeenCalledWith(1);
    expect(result).toContainEqual({id: 1, tag: 'suggested'});
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await suggestTagsAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});

describe('deleteLinkAction', function () {
  it('should call deleteLink with id', async function () {
    mockDeleteLink.mockClear();
    const result = await deleteLinkAction({data: {id: 1}});
    expect(mockDeleteLink).toHaveBeenCalledWith(1);
    expect(result.deleted).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await deleteLinkAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});
