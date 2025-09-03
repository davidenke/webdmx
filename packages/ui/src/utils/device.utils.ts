import type { Control } from '@webdmx/common';

import type { DeviceData } from './data.utils.js';
import type { Presets } from './preset.utils.js';

export interface CombinedControl {
  control: Control;
  channels: number[];
}

export type CombinedControls = Map<string, CombinedControl>;

/**
 * Get the reserved addresses of all devices.
 * Some devices can be excluded from the list, by providing their indices.
 */
export function getReservedAddresses(
  devices: Partial<DeviceData>[],
  presets: Presets,
  excludeDeviceIndices: number[] = [],
): number[] {
  return devices.reduce((addresses, { address, preset, profile }, index) => {
    if (excludeDeviceIndices.includes(index)) return addresses;
    if (preset === undefined || profile === undefined) return addresses;
    const { length } = presets.getChannels(preset, profile);
    return addresses.concat(Array.from({ length }, (_, i) => (address ?? 1) + i));
  }, [] as number[]);
}

/**
 * Delivers a combined result of controls in all given devices by
 * combining controls with the same name and type.
 */
export function getCombinedControls(devices: Partial<DeviceData>[], presets: Presets): CombinedControls {
  const uniqueControls = devices.reduce((controls, { preset, profile, address }) => {
    // the device must have an address to derive the channels
    if (address === undefined || preset === undefined || profile === undefined) return controls;

    // loop all device channels and corresponding controls and set it with a unique key
    presets.getChannels(preset, profile).forEach((name, channel) => {
      // find the control for the channel
      const control = presets.getControl(preset, name);
      if (control === undefined) return;

      // add the control to the map with a unique key
      const key = `${control.type}-${name}`;
      const channels = controls.get(key)?.channels ?? [];
      controls.set(key, { control, channels: [...channels, channel + address - 1] });
    });

    // deliver aggregated result
    return controls;
  }, new Map());

  // we used the keys for aggregation, so we can return the values only
  return uniqueControls;
}
