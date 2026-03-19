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
  renameTag: mock(async (id: number, text: string) => ({id, text})),
  mergeTag: mock(async (aliasId: number, canonicalTagId: number) => ({aliasId, canonicalTagId})),
  deleteTag: mock(async (id: number) => ({id, deleted: true})),
}));

let renameTagAction: any;
let mergeTagAction: any;
let deleteTagAction: any;
let mockGetSession: any;
let mockRenameTag: any;
let mockMergeTag: any;
let mockDeleteTag: any;

beforeAll(async function () {
  const mod = await import('../../src/lib/tag-actions');
  renameTagAction = mod.renameTagAction;
  mergeTagAction = mod.mergeTagAction;
  deleteTagAction = mod.deleteTagAction;

  const sessionMod = await import('../../src/lib/session.server');
  mockGetSession = sessionMod.getSession;

  const clientMod = await import('client');
  mockRenameTag = clientMod.renameTag;
  mockMergeTag = clientMod.mergeTag;
  mockDeleteTag = clientMod.deleteTag;
});

describe('renameTagAction', function () {
  it('should call renameTag with id and text', async function () {
    mockRenameTag.mockClear();
    const result = await renameTagAction({data: {id: 1, text: 'new-name'}});
    expect(mockRenameTag).toHaveBeenCalledWith(1, 'new-name');
    expect(result).toEqual({id: 1, text: 'new-name'});
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await renameTagAction({data: {id: 1, text: 'new-name'}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});

describe('mergeTagAction', function () {
  it('should call mergeTag with aliasId and canonicalTagId', async function () {
    mockMergeTag.mockClear();
    const result = await mergeTagAction({data: {aliasId: 1, canonicalTagId: 2}});
    expect(mockMergeTag).toHaveBeenCalledWith(1, 2);
    expect(result).toEqual({merged: true});
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await mergeTagAction({data: {aliasId: 1, canonicalTagId: 2}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});

describe('deleteTagAction', function () {
  it('should call deleteTag with id', async function () {
    mockDeleteTag.mockClear();
    const result = await deleteTagAction({data: {id: 1}});
    expect(mockDeleteTag).toHaveBeenCalledWith(1);
    expect(result.deleted).toBe(true);
  });

  it('should throw Unauthorized when not authenticated', async function () {
    mockGetSession.mockClear();
    mockGetSession.mockImplementationOnce(async () => null);

    try {
      await deleteTagAction({data: {id: 1}});
      expect.fail('should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('Unauthorized');
    }
  });
});
