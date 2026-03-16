import {drizzle, type PostgresJsDatabase} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

export function createDatabase(databaseUrl: string): Database {
  const queryClient = postgres(databaseUrl);
  return drizzle(queryClient, {schema});
}

export * from './schema';
export * from './queries/tags';
