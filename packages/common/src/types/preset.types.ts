/**
 * Defines a preset for a specific device.
 * Consists of a unique name and a set of controls.
 * The controls are grouped into profiles, so different profiles can reuse the same controls.
 */
export type Preset = {
  label: string;
  profiles: Record<string, Profile>;
  controls: Record<string, Control>;
};

/**
 * Some devices allow to switch between different DMX modes.
 * Thus, a device can have multiple profiles with different controls in various amounts of channels.
 */
export type Profile = {
  label: string;
  channels: string[];
};

/**
 * A single control of a preset.
 * Can be either a slider or a set of predefined options.
 */
export type Control = Options | Slider;

export type Options = {
  type: 'options';
  options: Array<Option | Slider>;
};

export type Option = {
  label: string;
  value: number;
};

export type Slider = {
  type: 'slider';
  label: string;
  from: number;
  to: number;
  step: number;
};
