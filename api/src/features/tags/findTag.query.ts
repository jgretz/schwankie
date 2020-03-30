import {FindTagQueryType} from './constants';

export class FindTagQuery {
  constructor(public type: FindTagQueryType, public term: string) {}
}
