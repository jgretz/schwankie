import {createDatabase} from 'database';
import {parseEnv} from 'utility-env';
import {setDependency} from 'utility-iocdi';
import {DATABASE, FeedsDomainDependencyEnv} from './Types';

export * from './api';
export * from './queries';
export * from './commands';

export type {Feed, FeedItem, FeedImportHistory} from './Types';

export function setupFeedsDomain() {
  const env = parseEnv(FeedsDomainDependencyEnv);

  setDependency(DATABASE, createDatabase(env.DATABASE_URL));
}
