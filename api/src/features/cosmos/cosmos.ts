import {
  CosmosClient,
  Database,
  Container,
  SqlQuerySpec,
  FeedOptions,
  RequestOptions,
  ItemDefinition,
} from '@azure/cosmos';

export class Cosmos {
  database: Database;

  constructor(private client: CosmosClient, databaseId: string) {
    this.database = client.database(databaseId);
  }

  collection(collectionId: string): Container {
    return this.database.container(collectionId);
  }

  async getItem<T>(collectionId: string, itemId: string): Promise<T> {
    const response = await this.collection(collectionId)
      .item(itemId)
      .read();

    return response.resource;
  }

  async query<T>(
    collectionId: string,
    query: string | SqlQuerySpec,
    options?: FeedOptions,
  ): Promise<Array<T>> {
    const response = await this.collection(collectionId)
      .items.query<T>(query, options)
      .fetchAll();

    return response.resources;
  }

  async create<T>(collectionId: string, item: T, options?: RequestOptions): Promise<T> {
    const response = await this.collection(collectionId).items.create(item, options);

    return response.resource;
  }

  async replace<T extends ItemDefinition>(
    collectionId: string,
    item: T,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.collection(collectionId)
      .item(item.id)
      .replace(item, options);

    return (response.item as unknown) as T;
  }

  async remove<T extends ItemDefinition>(
    collectionId: string,
    item: T,
    options?: RequestOptions,
  ): Promise<void> {
    await this.collection(collectionId)
      .item(item.id)
      .delete(options);
  }
}
