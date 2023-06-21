import {Controller} from '@nestjs/common';
import {CrudController} from './crud.controller';
import {tag} from '@prisma/client';
import {TagCreateDto} from '../dto/tag_create.dto';
import {TagUpdateDto} from '../dto/tag_update.dto';
import {TagsService} from '../services/tags.service';

@Controller('crud/tags')
export class TagsController extends CrudController<tag, TagCreateDto, TagUpdateDto> {
  constructor(tagsService: TagsService) {
    super(tagsService);
  }
}
