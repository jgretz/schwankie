import {Module} from '@nestjs/common';
import {CqrsModule} from '@nestjs/cqrs';
import {CosmosProvider} from '../cosmos';

import TagsController from './tags.controller';

import {FindTagContainingHandler} from './findTagContaining.handler';
import {CompileTagsHandler} from './compileTags.handler';

@Module({
  imports: [CqrsModule],
  providers: [CosmosProvider, FindTagContainingHandler, CompileTagsHandler],
  controllers: [TagsController],
})
export class TagsModule {}
