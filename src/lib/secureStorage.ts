import * as SecureStore from 'expo-secure-store';

/**
 * Supabase session storage backed by the OS keychain / keystore.
 * SecureStore caps values at ~2KB, so JWT sessions are stored in chunks.
 */
const CHUNK_SIZE = 1800;
const countKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, i: number) => `${key}.${i}`;

async function removeItem(key: string): Promise<void> {
  const raw = await SecureStore.getItemAsync(countKey(key));
  const count = raw ? Number.parseInt(raw, 10) : 0;
  await Promise.all([
    SecureStore.deleteItemAsync(countKey(key)),
    ...Array.from({ length: Number.isFinite(count) ? count : 0 }, (_, i) =>
      SecureStore.deleteItemAsync(chunkKey(key, i)),
    ),
  ]);
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const raw = await SecureStore.getItemAsync(countKey(key));
    if (!raw) return null;
    const count = Number.parseInt(raw, 10);
    if (!Number.isFinite(count) || count <= 0) return null;
    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
    );
    return parts.some((p) => p === null) ? null : parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    await removeItem(key);
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'gs')) ?? [];
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(chunkKey(key, i), c)));
    await SecureStore.setItemAsync(countKey(key), String(chunks.length));
  },

  removeItem,
};
