import {InjectIn} from 'injectx';
import {Schema} from 'database';
import type {MiscDomainDependencies} from '../Types';

function command({database}: MiscDomainDependencies) {
  return async function (email: string, tokens: string) {
    return database.update(Schema.google).set({email, tokens});
  };
}

export const updateGoogle = InjectIn(command);
