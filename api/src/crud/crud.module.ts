import {Module} from '@nestjs/common';
import {LinksController} from './controllers/links.controller';
import {TagsController} from './controllers/tags.controller';
import {LinksService} from './services/links.service';
import {TagsService} from './services/tags.service';
import {PrismaService} from '../shared/services/prisma.service';

@Module({
  controllers: [LinksController, TagsController],
  providers: [PrismaService, LinksService, TagsService],
})
export class CrudModule {}
