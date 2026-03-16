import {extractMetadata, type LinkMetadata} from 'metadata';

export async function fetchMetadata(url: string): Promise<LinkMetadata> {
  return extractMetadata(url);
}
