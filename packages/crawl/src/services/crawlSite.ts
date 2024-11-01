import type {CrawlResult} from '../Types';
import puppeteer from 'puppeteer';

async function fetchHtml(url: string) {
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();
    await page.goto(url);

    return await page.content();
  } finally {
    browser.close();
  }
}

export async function crawlSite(url: string): Promise<CrawlResult> {
  const html = await fetchHtml(url);

  const metascraper = require('metascraper')([
    require('metascraper-author')(),
    require('metascraper-description')(),
    require('metascraper-image')(),
    require('metascraper-logo')(),
    require('metascraper-title')(),
    require('metascraper-instagram')(),
    require('metascraper-youtube')(),
  ]);

  const metadata = await metascraper({html, url});

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
