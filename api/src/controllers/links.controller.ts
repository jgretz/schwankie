import {Controller} from '@nestjs/common';
import {CrudController} from './crud.controller';
import {link} from '@prisma/client';
import {LinkCreateDto, LinkUpdateDto} from '../dto';
import {LinksService} from '../services';

@Controller('links')
export class LinksController extends CrudController<link, LinkCreateDto, LinkUpdateDto> {
  constructor(linksService: LinksService) {
    super(linksService);
  }
}
