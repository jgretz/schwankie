import {match} from 'ts-pattern';
import client from '../client';

export async function updateGoogle(email: string, tokens: string): Promise<void> {
  const result = await client.api.misc.google.post({email, tokens});

  match(result.status)
    .with(200, () => {})
    .otherwise(() => {
      console.error(result.error?.value);
    });
}
