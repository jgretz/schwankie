import {createDatabase} from 'database';
import {parseEnv} from 'utility-env';
import {setDependency} from 'utility-iocdi';
import {DATABASE, LinksDomainDependencyEnv} from './Types';

export * from './api';
export * from './queries';
export * from './commands';

export type {Link} from './Types';

export function setupLinksDomain() {
  const env = parseEnv(LinksDomainDependencyEnv);

  setDependency(DATABASE, createDatabase(env.DATABASE_URL));
}
