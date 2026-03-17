import {beforeAll, afterEach} from 'bun:test';
import {init, getDb} from '../../src/db';
import {link, linkTag, tag, tagAlias} from 'database';
import {inArray} from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL required for domain tests');

let initialized = false;
const createdLinkIds: number[] = [];
const createdTagIds: number[] = [];

export function setupDb() {
  beforeAll(function () {
    if (!initialized) {
      init(DATABASE_URL);
      initialized = true;
    }
  });

  afterEach(async function () {
    const db = getDb();

    if (createdLinkIds.length > 0) {
      await db.delete(linkTag).where(inArray(linkTag.linkId, createdLinkIds));
      await db.delete(link).where(inArray(link.id, createdLinkIds));
      createdLinkIds.length = 0;
    }
    if (createdTagIds.length > 0) {
      await db.delete(tagAlias).where(inArray(tagAlias.canonicalTagId, createdTagIds));
      await db.delete(linkTag).where(inArray(linkTag.tagId, createdTagIds));
      await db.delete(tag).where(inArray(tag.id, createdTagIds));
      createdTagIds.length = 0;
    }
  });
}

export function trackLink(id: number) {
  createdLinkIds.push(id);
}

export function trackTag(id: number) {
  createdTagIds.push(id);
}

export {getDb};
