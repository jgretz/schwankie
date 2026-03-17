import {mock, beforeEach} from 'bun:test';
import {mockDb, resetStore, store} from './mock-db';

mock.module('../../src/db', () => ({
  init() {},
  getDb() {
    return mockDb;
  },
}));

export function setupDb() {
  beforeEach(function () {
    resetStore();
  });
}

export {store, mockDb};
