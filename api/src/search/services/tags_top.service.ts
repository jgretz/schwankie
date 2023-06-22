import {Injectable} from '@nestjs/common';
import {PrismaService} from '../../shared/services/prisma.service';
import {TAGS_LIST_SIZE} from 'src/constants';

@Injectable()
export class TopTagsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    return await this.prisma.tag.findMany({
      select: {
        id: true,
        text: true,
        _count: {
          select: {
            link_tag: true,
          },
        },
      },
      orderBy: {
        link_tag: {
          _count: 'desc',
        },
      },
      take: TAGS_LIST_SIZE,
    });
  }
}
