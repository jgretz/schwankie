import {apiFetch} from '../config';

export interface BulkUpsertEmailItemsInput {
  items: Array<{
    messageId: string;
    emailFrom: string;
    link: string;
    title?: string;
    description?: string;
  }>;
}

export async function bulkUpsertEmailItems(input: BulkUpsertEmailItemsInput): Promise<{inserted: number}> {
  return apiFetch<{inserted: number}>('/api/emails/bulk-upsert', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
