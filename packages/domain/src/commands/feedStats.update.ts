import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {Schema} from 'database';
import {formatISO} from 'date-fns';

function command({database}: DomainDependencies) {
  return async function () {
    return database
      .update(Schema.feedStats)
      .set({lastLoad: formatISO(new Date())})
      .execute();
  };
}

export const updateFeedStatsLastLoad = InjectIn(command);
