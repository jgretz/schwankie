import {CosmosClient} from '@azure/cosmos';

import {FactoryProvider} from '@nestjs/common';
import {DATABASE} from '../../constants';
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
      endpoint: process.env.AZURE_COSMOS_ENDPOINT,
      key: process.env.AZURE_COSMOS_KEY,
    });

    cosmos = new Cosmos(cosmosClient, process.env.AZURE_COSMOS_DATABASE_ID);

    return cosmos;
  },
} as FactoryProvider<Cosmos>;
