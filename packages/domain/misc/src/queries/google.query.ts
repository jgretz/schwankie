import {InjectIn} from 'injectx';
import type {MiscDomainDependencies} from '../Types';

function query({database}: MiscDomainDependencies) {
  return async function () {
    return await database.query.google.findFirst();
  };
}

export const googleQuery = InjectIn(query);
