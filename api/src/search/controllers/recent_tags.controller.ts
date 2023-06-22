import {Controller, Get} from '@nestjs/common';
import {RecentTagsService} from '../services/tags_recent.service';

@Controller('tags/recent')
export class RecentTagsController {
  constructor(private service: RecentTagsService) {}

  @Get()
  async findAll() {
    return this.service.get();
  }
}
