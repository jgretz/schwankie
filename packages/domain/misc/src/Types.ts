import {Schema, type Database} from 'database';
import {createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

export const MiscDomainDependencyEnv = z.object({
  DATABASE_URL: z.string(),
});

export const DATABASE = 'database';

export interface MiscDomainDependencies {
  [DATABASE]: Database;
}

const selectGoogleSchema = createSelectSchema(Schema.google);
export type Google = z.infer<typeof selectGoogleSchema>;
