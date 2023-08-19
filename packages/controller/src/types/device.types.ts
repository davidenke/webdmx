export interface Control {
  type: 'option';
  options: {
    label: string;
    value: string;
  }[];
}

export interface Device {
  channels: string[] | number[];
  ranges?: {
    control: Control;
  };
  channelGroups?: string[];
}
