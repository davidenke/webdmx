import type { AbstractDriver, DriverName } from '@webdmx/controller';
import { DMX } from '@webdmx/controller';
import type { TemplateResult } from 'lit';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, eventOptions, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import type { Data } from '../../utils/data.utils.js';
import { loadData, saveData } from '../../utils/data.utils.js';
import type { AddressEditorInteractiveEvent } from '../features/address-editor/address-editor.component.js';
import type { DeviceChannelsPreviewUpdateEvent } from '../features/device-channels-preview/device-channels-preview.component.js';
import type { EditorChangeEvent, EditorInteractiveEvent } from '../features/editor/editor.component.js';
import type { PreviewDeviceSelectedEvent } from '../features/preview/preview.component.js';

import styles from './root.component.scss?inline';

/**
 * @element webdmx-root
 */
@customElement('webdmx-root')
export class Root extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #dmx = new DMX();
  #driver!: AbstractDriver;

  #transferringTimeout?: number;
  #handleTransferring = this.handleTransferring.bind(this);

  @state() private data!: Data;
  @state() private selectedUniverseIndex!: number;
  @state() private selectedDevices: number[] = [];
  @state() private interactiveDevice?: number;
  @state() private driverNames = DMX.driverNames;

  @state() private loaded = false;
  @state() private idle = true;
  @state() private connected = false;
  @state() private isAddressEditorVisible = false;

  @eventOptions({ passive: true })
  private async handleModeChange() {
    const activeView = this.data.activeView === 'editor' ? 'preview' : 'editor';
    this.data = { ...this.data, activeView };
    await saveData(this.data);
  }

  @eventOptions({ passive: true })
  private handleTransferring(event: Event) {
    // as this is only implemented by the serial driver
    // right now, we need to differentiate at runtime
    // TODO: once the abstract driver enforces this to
    //  all drivers, we can remove this check
    if (!(event instanceof CustomEvent)) return;

    // positive transferring events are set immediately, but
    // negative transferring events are delayed to prevent flickering
    if (event.detail) {
      window.clearTimeout(this.#transferringTimeout);
      this.idle = false;
      this.#transferringTimeout = window.setTimeout(() => (this.idle = true), 200);
    } else if (!this.#transferringTimeout) {
      this.idle = true;
    }
  }

  @eventOptions({ passive: true })
  private async handleUniverseChange(event: InputEvent) {
    const { value } = event.target as HTMLInputElement;
    this.selectedUniverseIndex = this.data.universes.findIndex(({ label }) => label === value);
  }

  @eventOptions({ passive: true })
  private async handleDriverChange(event: InputEvent) {
    const { value } = event.target as HTMLInputElement;
    this.data = {
      ...this.data,
      universes: this.data.universes.map((universe, index) => {
        if (index !== this.selectedUniverseIndex) return universe;
        return { ...universe, driver: value as DriverName };
      }),
    };
    await saveData(this.data);
  }

  @eventOptions({ passive: true })
  private async handleConnect() {
    // get selected universe
    if (this.selectedUniverseIndex === undefined) return;

    // load universe driver
    const driverName = this.data.universes[this.selectedUniverseIndex]?.driver;
    const driver = await DMX.loadDriver(driverName);
    if (!driver) throw new Error(`Driver "${driverName}" not found`);
    this.#driver = new driver();

    // create universe and connect
    const universe = this.data.universes[this.selectedUniverseIndex]?.label ?? 'default';
    try {
      await this.#dmx.addUniverse(universe, this.#driver);
      this.#driver.addEventListener('transferring', this.#handleTransferring);
      this.connected = true;
    } catch (error) {
      // noop, usually the user aborted serial port selection
    }
  }

  @eventOptions({ passive: true })
  private async handleDisconnect() {
    // reset universe
    const universe = this.data.universes[this.selectedUniverseIndex]?.label ?? 'default';
    this.#dmx.updateAll(universe, 0);

    // wait for last transferring event to be fired
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.#driver.removeEventListener('transferring', this.#handleTransferring);

    // show editor when disconnecting
    this.data = { ...this.data, activeView: 'editor' };
    await saveData(this.data);

    // disconnect from universe
    await this.#dmx.close();
    this.connected = false;
  }

  @eventOptions({ passive: true })
  async handleEditorInteractive({ detail: deviceIndex }: EditorInteractiveEvent | AddressEditorInteractiveEvent) {
    this.interactiveDevice = deviceIndex;
  }

  @eventOptions({ passive: true })
  async handleEditorChange({ detail: devices }: EditorChangeEvent) {
    // collect updated data
    this.data = {
      ...this.data,
      universes: this.data.universes.map((universe, index) => {
        if (index !== this.selectedUniverseIndex) return universe;
        return { ...universe, devices };
      }),
    };

    // store changes
    await saveData(this.data);
  }

  @eventOptions({ passive: true })
  private handlePreviewDeviceSelected({ detail }: PreviewDeviceSelectedEvent) {
    this.selectedDevices = detail;
  }

  @eventOptions({ passive: true })
  private handleChannelsUpdate({ detail }: DeviceChannelsPreviewUpdateEvent) {
    const name = this.data.universes[this.selectedUniverseIndex]?.label ?? 'default';
    this.#dmx.update(name, detail);
  }

  override async connectedCallback() {
    super.connectedCallback();

    // load stored data (or initialize with empty data)
    this.data = await loadData();

    // TODO: remove me once universe editing is implemented
    if (!this.data.universes.length) {
      this.data = { ...this.data, universes: [{ label: 'default', driver: 'null', devices: [] }] };
    }

    // pre-select the first universe if only one is available
    if (this.data.universes.length === 1 && this.selectedUniverseIndex === undefined) {
      this.selectedUniverseIndex = 0;
    }

    // prevent preview mode if no universes are configured
    if (!this.connected || !this.data.universes.length) {
      this.data = { ...this.data, activeView: 'editor' };
      await saveData(this.data);
    }

    // we're done loading
    this.loaded = true;
  }

  override async disconnectedCallback() {
    // disconnect from universe
    await this.#dmx.close();
    this.connected = false;
    super.disconnectedCallback();
  }

  protected override render(): TemplateResult {
    if (!this.loaded) return html`<webdmx-loader>Loading</webdmx-loader>`;
    return html`
      <webdmx-layout>
        <nav slot="header">
          ${when(
            this.data.universes.length,
            () => html`
              <select ?disabled="${this.connected}" @change="${this.handleUniverseChange}">
                ${this.data.universes.map(({ label }) => html`<option .value="${label}">${label}</option>`)}
              </select>

              <select ?disabled="${this.connected}" @change="${this.handleDriverChange}">
                ${this.driverNames.map(
                  (driver) => html`
                    <option
                      ?selected="${driver === this.data.universes[this.selectedUniverseIndex]?.driver}"
                      .value="${driver}"
                    >
                      ${driver}
                    </option>
                  `,
                )}
              </select>

              ${when(
                !this.connected,
                () => html`<button ?disabled="${!this.idle}" @click="${this.handleConnect}">Connect</button>`,
                () => html`<button ?disabled="${!this.idle}" @click="${this.handleDisconnect}">Disconnect</button>`,
              )}
            `,
            () => html`<span>No universes configured</span>`,
          )}
        </nav>

        <nav slot="header">
          <webdmx-switch
            ?active="${this.data.activeView === 'preview'}"
            ?disabled="${!this.connected || this.data.universes.length === 0}"
            @webdmx-switch:toggle="${this.handleModeChange}"
          >
            <span slot="off">Preview</span>
            <span slot="on">Edit</span>
          </webdmx-switch>
        </nav>

        ${this.data.activeView === 'editor'
          ? html`
              <webdmx-editor
                .interactiveDevice="${this.interactiveDevice}"
                .universe="${this.data.universes[this.selectedUniverseIndex]}"
                @webdmx-editor:interactive="${this.handleEditorInteractive}"
                @webdmx-editor:change="${this.handleEditorChange}"
              ></webdmx-editor>

              ${when(
                this.isAddressEditorVisible || true,
                () => html`
                  <webdmx-address-editor
                    slot="footer"
                    .devices="${this.data.universes[this.selectedUniverseIndex]?.devices}"
                    .interactiveDevice="${this.interactiveDevice}"
                    @webdmx-address-editor:interactive="${this.handleEditorInteractive}"
                    @webdmx-address-editor:change="${this.handleEditorChange}"
                  ></webdmx-address-editor>
                `,
              )}
            `
          : html`
              <webdmx-preview
                ?connected="${this.connected}"
                .devices="${this.data.universes[this.selectedUniverseIndex]?.devices}"
                .selectedDevices="${this.selectedDevices}"
                @webdmx-preview:device-selected="${this.handlePreviewDeviceSelected}"
              ></webdmx-preview>

              <webdmx-device-channels-preview
                slot="footer"
                ?connected="${this.connected}"
                .devices="${this.data.universes[this.selectedUniverseIndex]?.devices.filter((_, index) =>
                  this.selectedDevices.includes(index),
                )}"
                @webdmx-device-channels-preview:update="${this.handleChannelsUpdate}"
              ></webdmx-device-channels-preview>
            `}
      </webdmx-layout>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'webdmx-root': Root;
  }
}
