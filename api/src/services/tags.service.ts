import {Injectable} from '@nestjs/common';
import * as R from 'ramda';

import {PrismaService} from './prisma.service';
import {TagCreateDto, TagUpdateDto} from '../dto';
import {CrudService} from '../Types';
import {tag} from '@prisma/client';

const clean = R.pipe(R.trim, R.toLower);

@Injectable()
export class TagsService implements CrudService<tag, TagCreateDto, TagUpdateDto> {
  constructor(private prisma: PrismaService) {}

  async find(id: number) {
    return await this.prisma.tag.findFirst({
      where: {id},
    });
  }

  async findAll() {
    return await this.prisma.tag.findMany();
  }

  // making this companion method to make internal calls more clear
  async findOrCreate(term: string) {
    const text = clean(term);

    const existing = await this.prisma.tag.findFirst({
      where: {text},
    });

    if (existing) {
      return existing;
    }

    return await this.prisma.tag.create({
      data: {
        text,

        create_date: new Date(),
        update_date: new Date(),
      },
    });
  }

  async create({text}: TagCreateDto) {
    return this.findOrCreate(text);
  }

  async update(dto: TagUpdateDto) {
    const text = clean(dto.text);

    return await this.prisma.tag.update({
      data: {
        text,
        update_date: new Date(),
      },
      where: {
        id: dto.id,
      },
    });
  }

  async delete(id: number) {
    await this.prisma.link_tag.deleteMany({
      where: {
        tag_id: id,
      },
    });

    await this.prisma.tag.delete({
      where: {id},
    });
  }
}
