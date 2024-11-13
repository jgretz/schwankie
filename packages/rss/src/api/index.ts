import {Elysia} from 'elysia';
import {GetApi} from './get';
import {PostApi} from './post';

export const Api = new Elysia({prefix: 'rss'}).use(GetApi).use(PostApi);
