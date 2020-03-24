import {Module} from '@nestjs/common';
import {CqrsModule} from '@nestjs/cqrs';
import {CosmosProvider} from '../cosmos';

import LinksController from './links.controller';

import {FindRecentHandler} from './findRecent.handler';
import {FindBySearchHandler} from './findBySearch.handler';

@Module({
  imports: [CqrsModule],
  providers: [CosmosProvider, FindRecentHandler, FindBySearchHandler],
  controllers: [LinksController],
})
export class LinksModule {}
