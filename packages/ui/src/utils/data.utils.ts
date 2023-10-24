import type { Preset } from '@webdmx/common';
import type { DriverName } from '@webdmx/controller';

import { readData, writeData } from './storage.utils.js';

export type DeviceData = {
  /**
   * Name of the preset of the device.
   */
  preset: Preset['label'];

  /**
   * Name of the profile of the device.
   */
  profile: keyof Preset['profiles'];

  /**
   * The start address of the device in the universe.
   */
  address: number;

  /**
   * The relative position of the device in the universe editor as percentage.
   */
  position: {
    x: number;
    y: number;
  };
};

/**
 * A single universe with multiple devices.
 */
export type UniverseData = {
  label: string;
  devices: Partial<DeviceData>[];
  driver: DriverName;
};

/**
 * The whole data structure of the configured universes.
 */
export type Data = {
  /**
   * Multiple configured universes.
   */
  universes: UniverseData[];

  /**
   * The current active view.
   */
  activeView: 'editor' | 'preview';
};

const DATA_KEY = 'data' as const;
const EMPTY_DATA: Data = {
  universes: [],
  activeView: 'editor',
};

/**
 * Convenience function to retrieve data.
 */
export async function loadData(): Promise<Data> {
  const data = await readData(DATA_KEY);
  return data ?? EMPTY_DATA;
}

/**
 * Convenience function to save the given data.
 */
export async function saveData(data: Data): Promise<void> {
  writeData(DATA_KEY, data);
}

/**
 * Extend the storage map with the data key and the corresponding type.
 */
declare global {
  interface StorageMap {
    [DATA_KEY]: Data;
  }
}
