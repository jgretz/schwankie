import {Controller} from '@nestjs/common';
import {CrudController} from './crud.controller';
import {tag} from '@prisma/client';
import {TagCreateDto, TagUpdateDto} from '../dto';
import {TagsService} from '../services';

@Controller('tags')
export class TagsController extends CrudController<tag, TagCreateDto, TagUpdateDto> {
  constructor(tagsService: TagsService) {
    super(tagsService);
  }
}
