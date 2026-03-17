import {beforeEach} from 'bun:test';
import {resetStore, store, mockDb} from './mock-db';

// mock.module lives in preload.ts — it must register before
// any test file's static imports resolve db.ts.

export function setupDb() {
  beforeEach(function () {
    resetStore();
  });
}

export {store, mockDb};
