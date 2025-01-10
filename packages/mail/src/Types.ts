import type {gmail_v1} from 'googleapis';
import {z} from 'zod';

export const MailDomainDependencyEnv = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
});

export const GMAIL = 'gmail';
export const USER_ID = 'userId';

export interface MailDomainDependencies {
  [GMAIL]: gmail_v1.Gmail;
  [USER_ID]: string;
}
