import {Injectable} from '@nestjs/common';
import {PrismaService} from '../../shared/services/prisma.service';
import {TAGS_LIST_SIZE} from 'src/constants';

@Injectable()
export class RecentTagsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    return await this.prisma.link_tag.findMany({
      select: {
        tag: true,
      },
      distinct: ['tag_id'],

      orderBy: {
        update_date: 'desc',
      },

      take: TAGS_LIST_SIZE,
    });
  }
}
