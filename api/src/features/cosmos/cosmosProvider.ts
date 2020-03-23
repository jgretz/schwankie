import {CosmosClient} from '@azure/cosmos';

import {FactoryProvider} from '@nestjs/common';
import {DATABASE} from '../../constants';
import Config from './config';
import {Cosmos} from './cosmos';

// we should only create 1 per memory space
let cosmos: Cosmos = null;

export default {
  provide: DATABASE,
  useFactory: (): Cosmos => {
    if (cosmos) {
      return cosmos;
    }

    const cosmosClient = new CosmosClient({
      endpoint: Config.endpoint,
      key: Config.key,
    });

    cosmos = new Cosmos(cosmosClient, Config.databaseId);

    return cosmos;
  },
} as FactoryProvider<Cosmos>;
