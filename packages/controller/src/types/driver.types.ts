export type Channels = Uint8Array;

export interface Driver {
  channels: Uint8Array;
  sendInterval: number;

  init(): Promise<void>;
  start(): void;
  stop(): void;
  get(channel: number): number;
  update(channels: Channels, extraData?: any): void;
  updateAll(value: number): void;
  close(): Promise<void> | void;
}
