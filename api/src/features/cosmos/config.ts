import {config} from 'dotenv';

if (process.env.NODE_ENV !== 'PRODUCTION') {
  config();
}

export type CosmosConfig = {
  endpoint: string;
  key: string;
  databaseId: string;
};

export default {
  endpoint: process.env.AZURE_COSMOS_ENDPOINT,
  key: process.env.AZURE_COSMOS_KEY,
  databaseId: process.env.AZURE_COSMOS_DATABASE_ID,
} as CosmosConfig;
