import {drizzle, type PostgresJsDatabase} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as Schema from './schema/links.schema';

export type Database = PostgresJsDatabase<typeof Schema>;

export function createDatabase(databaseUrl: string): Database {
  const queryClient = postgres(databaseUrl);
  return drizzle(queryClient, {schema: Schema});
}
