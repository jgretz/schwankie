import type {Database} from 'database';
import {z} from 'zod';

export const DomainDependencyEnv = z.object({
  DATABASE_URL: z.string(),
});

export const DATABASE = 'database';

export interface DomainDependencies {
  [DATABASE]: Database;
}
