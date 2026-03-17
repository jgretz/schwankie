import {mock} from 'bun:test';
import {mockDb} from './mock-db';

// CRITICAL: This file runs before any test file loads.
// mock.module must register before static imports resolve db.ts,
// otherwise tests hit the real database.
mock.module('../../src/db', () => ({
  init() {},
  getDb() {
    return mockDb;
  },
}));
