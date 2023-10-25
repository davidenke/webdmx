import type { Preset } from '@webdmx/common';
import type { DriverName } from '@webdmx/controller';
import { state } from 'lit-shared-state';

import { persistLocalStorage } from '../utils/storage.utils.js';

export type DeviceConfig = {
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
export type UniverseConfig = {
  label: string;
  devices: Partial<DeviceConfig>[];
  driver: DriverName;
};

/**
 * The key of the config in the context / store.
 */
export const CONFIG_KEY = 'config' as const;

/**
 * The current configuration of the application.
 * Will be synced to the local storage.
 */
@state(persistLocalStorage())
class ConfigState {
  /**
   * Multiple configured universes.
   */
  universes: UniverseConfig[] = [];

  /**
   * The current active view.
   */
  activeView: 'editor' | 'preview' = 'editor';
}

export const config = new ConfigState();
