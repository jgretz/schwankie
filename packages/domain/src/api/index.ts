import {Elysia} from 'elysia';
import {LinksApi} from './links';
import {FeedsApi} from './feeds';

export const Api = new Elysia().use(LinksApi).use(FeedsApi);
