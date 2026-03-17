import {createDatabase, type Database} from 'database';

let instance: Database | null = null;

export function init(databaseUrl: string): void {
  if (instance) throw new Error('domain already initialized');
  instance = createDatabase(databaseUrl);
}

export function getDb(): Database {
  if (!instance) throw new Error('domain not initialized — call init() first');
  return instance;
}
