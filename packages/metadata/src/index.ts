import metascraper from 'metascraper';
import metascraperAuthor from 'metascraper-author';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperTitle from 'metascraper-title';
import metascraperUrl from 'metascraper-url';

export type LinkMetadata = {
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  tags: string[];
};

const scraper = metascraper([
  metascraperAuthor(),
  metascraperDescription(),
  metascraperImage(),
  metascraperTitle(),
  metascraperUrl(),
]);

export async function extractMetadata(url: string): Promise<LinkMetadata> {
  const fallback: LinkMetadata = {url, title: url, description: null, imageUrl: null, tags: []};

  try {
    const response = await fetch(url, {
      headers: {'User-Agent': 'Schwankie/5.0'},
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });

    const html = await response.text();
    const data = await scraper({html, url});

    return {
      url,
      title: data.title ?? url,
      description: data.description ?? null,
      imageUrl: data.image ?? null,
      tags: data.author ? [data.author] : [],
    };
  } catch {
    return fallback;
  }
}
