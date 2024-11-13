import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {Schema} from 'database';

function command({database}: DomainDependencies) {
  return async function () {
    return database.update(Schema.feedStats).set({lastLoad: new Date().toUTCString()});
  };
}

export const updateFeedStatsLastLoad = InjectIn(command);
