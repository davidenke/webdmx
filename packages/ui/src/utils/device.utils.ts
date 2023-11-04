import type { DeviceData } from './data.utils.js';
import type { Presets } from './preset.utils.js';

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
    const { length } = presets.getChannels(preset, profile);
    return addresses.concat(Array.from({ length }, (_, i) => address! + i));
  }, [] as number[]);
}
