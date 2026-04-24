import * as SecureStore from 'expo-secure-store';

const APP_GROUP = 'group.com.schwankie.app';
const API_URL_KEY = 'schwankie_api_url';
const API_KEY_KEY = 'schwankie_api_key';

const options: SecureStore.SecureStoreOptions = {accessGroup: APP_GROUP};

export async function setSharedApiUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(API_URL_KEY, url, options);
}

export async function getSharedApiUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(API_URL_KEY, options);
}

export async function setSharedApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_KEY, key, options);
}

export async function getSharedApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(API_KEY_KEY, options);
}
