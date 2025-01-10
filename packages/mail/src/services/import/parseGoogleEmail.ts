import type {gmail_v1} from 'googleapis';
import type {GaxiosResponse} from 'googleapis-common';

export async function parseGoogleEmail(rawEmail: GaxiosResponse<gmail_v1.Schema$Message>) {
  return {};
}
