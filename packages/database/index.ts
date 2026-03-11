import {drizzle, type PostgresJsDatabase} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export type Database = PostgresJsDatabase;

export function createDatabase(databaseUrl: string): Database {
  const queryClient = postgres(databaseUrl);
  return drizzle(queryClient);
}
