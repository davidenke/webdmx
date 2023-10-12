export type Preset = {
  name: string;
  profiles: Record<string, Profile>;
  controls: Record<string, Control>;
};

export type Profile = {
  label: string;
  channels: string[];
};

export type Control = ({ type: 'options' } & Options) | ({ type: 'slider' } & Slider);

export type Options = {
  options: Array<Option | Slider>;
};

export type Option = {
  label: string;
  value: number;
};

export type Slider = {
  label: string;
  from: number;
  to: number;
  step: number;
};
