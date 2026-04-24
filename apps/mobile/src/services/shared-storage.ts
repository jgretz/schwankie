import {ExtensionStorage} from '@bacons/apple-targets';

const APP_GROUP = 'group.com.schwankie.app';
const API_URL_KEY = 'apiUrl';
const API_KEY_KEY = 'apiKey';

const storage = new ExtensionStorage(APP_GROUP);

export function setSharedApiUrl(url: string): void {
  storage.set(API_URL_KEY, url);
}

export function setSharedApiKey(key: string): void {
  storage.set(API_KEY_KEY, key);
}
