import * as SecureStore from 'expo-secure-store';

export async function getSecureJSON<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (raw === null) {
    return null;
  }
  return JSON.parse(raw) as T;
}

export async function setSecureJSON<T>(key: string, value: T): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function deleteSecureItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
