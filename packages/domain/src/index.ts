import {createDatabase} from 'database';
import {parseEnv} from 'utility-env';
import {setDependency} from 'utility-iocdi';
import {DATABASE, DomainDependencyEnv} from './Types';

export * from './api';

export function setupDomain() {
  const env = parseEnv(DomainDependencyEnv);

  setDependency(DATABASE, createDatabase(env.DATABASE_URL));
}
