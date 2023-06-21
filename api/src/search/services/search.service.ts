import {Injectable} from '@nestjs/common';
import * as R from 'ramda';

import {PrismaService} from '../../shared/services/prisma.service';
import {SearchDto} from '../dto/search.dto';

import {DEFAULT_SKIP, DEFAULT_TAKE} from '../../constants';

const clean = R.pipe(R.trim, R.toLower);
const cleanAll = R.map(clean);
const splitAndClean = R.pipe(R.split(','), cleanAll);
const makeSearchTerm = R.pipe(splitAndClean, R.join(' | '));

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search({query, skip, take}: SearchDto) {
    const search = makeSearchTerm(query || '');
    const tags = splitAndClean(query || '');

    const skipVal = Number.isNaN(skip) ? DEFAULT_SKIP : skip;
    const takeVal = Number.isNaN(take) ? DEFAULT_TAKE : take;

    const where = query
      ? {
          OR: [
            {
              title: {
                search,
              },
            },
            {
              description: {
                search,
              },
            },
            {
              link_tag: {
                some: {
                  tag: {
                    text: {
                      in: tags,
                    },
                  },
                },
              },
            },
          ],
        }
      : undefined;

    return await this.prisma.link.findMany({
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
      skip: skipVal,
      take: takeVal,
      where,
      orderBy: {
        update_date: 'desc',
      },
    });
  }
}
