import {InjectIn} from 'injectx';
import {Schema} from 'database';
import {eq} from 'drizzle-orm';
import type {LinksDomainDependencies} from '../Types';
import {prepareUpdateObject} from 'domain/util';

interface LinkUpdate {
  id: number;
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
}

function command({database}: LinksDomainDependencies) {
  return async function (link: LinkUpdate) {
    const obj = prepareUpdateObject(link);

    return database.update(Schema.link).set(obj).where(eq(Schema.link.id, link.id));
  };
}

export const linkUpdate = InjectIn(command);
