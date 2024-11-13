import {createDatabase} from 'database';
import {parseEnv} from 'utility-env';
import {setDependency} from 'utility-iocdi';
import {DATABASE, DomainDependencyEnv} from './Types';

export * from './api';
export * from './queries';
export * from './commands';

export type {Links, Link, Feed, FeedItem, FeedStats} from './Types';

export function setupDomain() {
  const env = parseEnv(DomainDependencyEnv);

  setDependency(DATABASE, createDatabase(env.DATABASE_URL));
}
