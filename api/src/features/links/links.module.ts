import {Module} from '@nestjs/common';
import {CqrsModule} from '@nestjs/cqrs';
import {CosmosProvider} from '../cosmos';

import LinksController from './links.controller';

import {FindRecentHandler} from './findRecent.handler';
import {FindBySearchHandler} from './findBySearch.handler';
import {FindByUrlHandler} from './findByUrl.handler';

import {CreateLinkHandler} from './createLink.handler';
import {UpdateLinkHandler} from './updateLink.handler';

@Module({
  imports: [CqrsModule],
  providers: [
    CosmosProvider,
    FindRecentHandler,
    FindBySearchHandler,
    FindByUrlHandler,
    CreateLinkHandler,
    UpdateLinkHandler,
  ],
  controllers: [LinksController],
})
export class LinksModule {}
