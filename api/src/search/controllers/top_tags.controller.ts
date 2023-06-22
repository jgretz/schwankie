import {Controller, Get} from '@nestjs/common';
import {TopTagsService} from '../services/tags_top.service';

@Controller('tags/top')
export class TopTagsController {
  constructor(private service: TopTagsService) {}

  @Get()
  async findAll() {
    return this.service.get();
  }
}
