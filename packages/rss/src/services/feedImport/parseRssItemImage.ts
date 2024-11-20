import metascraper from 'metascraper';
import metascraperImage from 'metascraper-image';
import type {ParseRssFeed, ParseRssItem} from '../../Types';

async function scrapeImage(html: string, url: string) {
  const scraper = metascraper([metascraperImage()]);
  const metadata = await scraper({html, url});

  return metadata.image;
}

export async function parseRssItemImage(feed: ParseRssFeed, item: ParseRssItem) {
  try {
    // good feed gave us an image
    const image = item.enclosure?.url ?? feed.image?.url;
    if (image) {
      return image;
    }

    // Try to scrape the image from the content
    const sources = [item.content, item.contentSnippet, item.description, item.summary];
    for (let x = 0; x < sources.length; x++) {
      const html = sources[x];
      if (!html) {
        continue;
      }

      const imageUrl = await scrapeImage(html, item.link);
      if (imageUrl) {
        return imageUrl;
      }
    }

    // Fallback to fetching the site
    const siteResponse = await fetch(item.link);
    const siteHtml = await siteResponse.text();
    return await scrapeImage(siteHtml, item.link);
  } catch (error) {
    console.error(`Error Parsing Image - ${item.link}`, error);
    return undefined;
  }
}
