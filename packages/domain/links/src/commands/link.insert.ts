import {Schema} from 'database';
import {InjectIn} from 'injectx';
import type {LinksDomainDependencies} from '../Types';
import {prepareInsertObject} from 'domain/util';

type LinkInsert = Omit<typeof Schema.link.$inferInsert, 'createDate' | 'updateDate'>;

function command({database}: LinksDomainDependencies) {
  return async function (link: LinkInsert) {
    const obj = prepareInsertObject(link);

    return database.insert(Schema.link).values(obj);
  };
}

export const linkInsert = InjectIn(command);
