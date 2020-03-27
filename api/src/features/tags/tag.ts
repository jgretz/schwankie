import {ItemDefinition} from '@azure/cosmos';

export const TAGS = 'tags';

export interface Tag extends ItemDefinition {
  title: string;
  count: number;
}
