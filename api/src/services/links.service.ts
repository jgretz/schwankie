import {Injectable} from '@nestjs/common';

import * as R from 'ramda';

import {PrismaService} from './prisma.service';
import {LinkCreateDto, LinkUpdateDto} from '../dto';
import {TagsService} from './tags.service';
import {link} from '@prisma/client';
import {CrudService} from '../Types';

@Injectable()
export class LinksService implements CrudService<link, LinkCreateDto, LinkUpdateDto> {
  constructor(private prisma: PrismaService, private tagService: TagsService) {}

  async find(id: number) {
    return await this.prisma.link.findFirst({
      where: {id},
    });
  }

  async findAll() {
    return await this.prisma.link.findMany();
  }

  async create(dto: LinkCreateDto) {
    const {url, title, description, image_url, tags} = dto;

    // if we have one, update it
    const existing = await this.prisma.link.findFirst({
      where: {
        url,
      },
    });

    if (existing) {
      return this.update({
        id: existing.id,
        ...dto,
      });
    }

    // create a new one
    const link = await this.prisma.link.create({
      data: {
        url,
        title,
        description,
        image_url,

        create_date: new Date(),
        update_date: new Date(),
      },
    });

    const link_tag = await this.updateTagsForLink(link, tags);

    return {
      ...link,
      link_tag,
    };
  }

  async update(dto: LinkUpdateDto) {
    const {url, title, description, image_url, tags} = dto;

    const link = await this.prisma.link.update({
      data: {
        url,
        title,
        description,
        image_url,
        update_date: new Date(),
      },
      where: {
        id: dto.id,
      },
    });

    const link_tag = await this.updateTagsForLink(link, tags);

    return {
      ...link,
      link_tag,
    };
  }

  async delete(id: number) {
    await this.prisma.link_tag.deleteMany({
      where: {
        link_id: id,
      },
    });

    await this.prisma.link.delete({
      where: {id},
    });
  }

  async updateTagsForLink({id: link_id}: link, tagString: string) {
    const tagWork = tagString.split(',').map((t) => this.tagService.findOrCreate(t));
    const tags = await Promise.all(tagWork);

    const existingJoins = await this.prisma.link_tag.findMany({
      where: {
        link_id,
      },
    });

    // split joins by new specification
    const [joinsToKeep, joinsToRemove] = R.splitWhen(
      (j) => !tags.some((t) => j.tag_id === t.id),
      existingJoins,
    );

    // create missing joins
    const joinsToCreate = tags
      .filter((t) => !existingJoins.some((j) => j.tag_id === t.id))
      .map((t) => ({
        tag_id: t.id,
        link_id,
      }));

    const newJoinWork = joinsToCreate.map((j) => this.prisma.link_tag.create({data: j}));
    const newJoins = await Promise.all(newJoinWork);

    // remove old joins
    await this.prisma.link_tag.deleteMany({
      where: {
        id: {in: joinsToRemove.map(({id}) => id)},
      },
    });

    // compile result
    return [...joinsToKeep, ...newJoins];
  }
}
