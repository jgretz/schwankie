import {Controller} from '@nestjs/common';
import {CrudController} from './crud.controller';
import {link} from '@prisma/client';
import {LinkCreateDto} from '../dto/link_create.dto';
import {LinkUpdateDto} from '../dto/link_update.dto';
import {LinksService} from '../services/links.service';

@Controller('crud/links')
export class LinksController extends CrudController<link, LinkCreateDto, LinkUpdateDto> {
  constructor(linksService: LinksService) {
    super(linksService);
  }
}
