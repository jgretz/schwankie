import {Elysia} from 'elysia';
import {LinksApi} from './links';

export const Api = new Elysia().use(LinksApi);
