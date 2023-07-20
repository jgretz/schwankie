import {Injectable} from '@nestjs/common';

import * as cheerio from 'cheerio';

import {PrismaService} from '../../shared/services/prisma.service';
import {CrawlDto} from '../dto/crawl.dto';

const isUseableImageLink = (src = ''): boolean => {
  return src.startsWith('http');
};

const findUseableImage = ($: cheerio.CheerioAPI): string | undefined => {
  return $('img')
    .filter((_, el) => isUseableImageLink($(el).attr('src')))
    .first()
    ?.attr('src');
};

async function crawlSite(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const title = $('head').find('title').text();
  const description = $('head').find('description').text();
  const image_url = findUseableImage($);

  return {
    url,
    title,
    description,
    image_url,
    link_tag: [],
    date: new Date(),
  };
}

async function findExisting(prisma: PrismaService, url: string) {
  return await prisma.link.findFirst({
    select: {
      id: true,
      title: true,
      description: true,
      url: true,
      image_url: true,
      update_date: true,
      link_tag: {
        select: {
          tag: {
            select: {
              id: true,
              text: true,
            },
          },
        },
      },
    },
    where: {
      url,
    },
  });
}

@Injectable()
export class CrawlService {
  constructor(private prisma: PrismaService) {}

  async crawl({url}: CrawlDto) {
    const existing = await findExisting(this.prisma, url);
    if (existing) {
      return existing;
    }

    return await crawlSite(url);
  }
}
