import type {CrawlResult} from '../Types';

import metascraper from 'metascraper';
import metascraperAuthor from 'metascraper-author';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperLogo from 'metascraper-logo';
import metascraperTitle from 'metascraper-title';
import metascraperInstagram from 'metascraper-instagram';
import metascraperYoutube from 'metascraper-youtube';

async function fetchHtml(url: string) {
  const result = await fetch(url);

  if (!result.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return await result.text();
}

export async function crawlSite(url: string): Promise<CrawlResult> {
  const html = await fetchHtml(url);

  const scraper = metascraper([
    metascraperAuthor(),
    metascraperDescription(),
    metascraperImage(),
    metascraperLogo(),
    metascraperTitle(),
    metascraperInstagram(),
    metascraperYoutube(),
  ]);

  const metadata = await scraper({html, url});

  const tags = [];
  if (metadata.author) {
    tags.push(metadata.author);
  }

  return {
    url,
    title: metadata.title,
    description: metadata.description,
    imageUrl: metadata.image || metadata.logo,
    tags,
  };
}
