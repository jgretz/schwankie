import {parseEnv} from 'utility-env';
import {setDependency} from 'utility-iocdi';
import {API_KEY, SecurityDependencyEnv} from './Types';

export * from './api/apikey.plugin';
export * from './eden/generateConfig';

export function setupSecurity() {
  const env = parseEnv(SecurityDependencyEnv);

  setDependency(API_KEY, env.API_KEY);
}
