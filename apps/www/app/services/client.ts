import {treaty} from '@elysiajs/eden';
import type {App} from '@api';
import {serverEnv} from '@www/utils/env';

export default treaty<App>(serverEnv.API_URL);
