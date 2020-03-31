import {ItemDefinition} from '@azure/cosmos';

export const LINKS = 'links';

export interface Link extends ItemDefinition {
  url: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
  date: Date;
}
