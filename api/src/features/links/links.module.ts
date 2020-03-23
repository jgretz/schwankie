import {Module} from '@nestjs/common';
import {CqrsModule} from '@nestjs/cqrs';
import {CosmosProvider} from '../cosmos';
import LinksController from './links.controller';
import {FindDefaultHandler} from './findDefault.handler';

@Module({
  imports: [CqrsModule],
  providers: [CosmosProvider, FindDefaultHandler],
  controllers: [LinksController],
})
export class LinksModule {}
