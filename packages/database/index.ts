import {drizzle, type PostgresJsDatabase} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as LinkSchema from './schema/links.schema';
import * as RssSchema from './schema/rss.schema';

const Schema = {...LinkSchema, ...RssSchema};

export type Database = PostgresJsDatabase<typeof Schema>;

export function createDatabase(databaseUrl: string): Database {
  const queryClient = postgres(databaseUrl);
  return drizzle(queryClient, {schema: Schema});
}

export {Schema};
