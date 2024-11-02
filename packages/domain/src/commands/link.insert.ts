import {Schema} from 'database';
import type {DomainDependencies} from '../Types';
import {prepareInsertObject} from './util/prepareInsertObj';
import {InjectIn} from 'injectx';

type LinkInsert = Omit<typeof Schema.link.$inferInsert, 'createDate' | 'updateDate'>;

function command({database}: DomainDependencies) {
  return async function (link: LinkInsert) {
    const obj = prepareInsertObject(link);

    return database.insert(Schema.link).values(obj);
  };
}

export const linkInsert = InjectIn(command);
