import {z} from 'zod';

export const SecurityDependencyEnv = z.object({
  API_KEY: z.string(),
});

export const API_KEY = 'apiKey';

export interface SecurityDependencies {
  [API_KEY]: string;
}
