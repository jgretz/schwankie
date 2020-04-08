import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {Dependencies} from '@nestjs/common';

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import {DATABASE} from '../../constants';
import {Cosmos} from '../cosmos/cosmos';

import {FindByUrlQuery} from './findByUrl.query';
import {LINKS, Link} from './link';

const findExisting = async (cosmos: Cosmos, url: string): Promise<Link> => {
  const results = await cosmos.query<Link>(
    LINKS,
    `
      SELECT l.id, l.url, l.title, l.description, l.tags, l.image, l.date
      FROM links l
      where l.url = '${url}'
      ORDER BY l.date DESC
    `,
  );

  return results.length > 0 ? results[0] : null;
};

const findDetails = async (url: string): Promise<Link> => {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const title = $('head').find('title').text();
  const description = $('head').find('description').text();
  const image = $('img').first()?.attr('src');

  return {
    url,
    title,
    description,
    image,
    tags: [],
    date: new Date(),
  };
};

@QueryHandler(FindByUrlQuery)
@Dependencies(DATABASE)
export class FindByUrlHandler implements IQueryHandler<FindByUrlQuery> {
  constructor(private readonly cosmos: Cosmos) {}

  async execute(query: FindByUrlQuery): Promise<Link> {
    const existing = await findExisting(this.cosmos, query.url);
    if (existing) {
      return existing;
    }

    const scrape = await findDetails(query.url);
    return scrape;
  }
}
