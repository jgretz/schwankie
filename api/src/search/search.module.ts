import {Module} from '@nestjs/common';
import {SearchController} from './controllers/search.controller';
import {SearchService} from './services/search.service';
import {PrismaService} from '../shared/services/prisma.service';

@Module({
  controllers: [SearchController],
  providers: [PrismaService, SearchService],
})
export class SearchModule {}
