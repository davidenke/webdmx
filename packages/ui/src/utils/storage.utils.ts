/**
 * Map of all storage keys to their respective types.
 * We use an interface here, as this can be extended by other
 * packages using Typescripts declaration merging.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- will be merged with other packages later
  interface StorageMap {}
}

/**
 * Union type of all storage keys.
 */
type StorageKey = keyof StorageMap;

// use an internal prefix to avoid collisions with
// other packages in local storage
const STORAGE_PREFIX = 'webdmx-';

/**
 * Generic function to read data from storage.
 */
export async function readData<K extends StorageKey>(key: K): Promise<StorageMap[K] | undefined> {
  const data = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  return data ? JSON.parse(data) : undefined;
}

/**
 * Generic function to write data to storage.
 */
export async function writeData<K extends StorageKey>(key: K, value: StorageMap[K]): Promise<void> {
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
}
