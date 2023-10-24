import { DMX, type DriverName, type SerialDriver } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { type Data, loadData, saveData } from '../../utils/data.utils.js';
import type { EditorChangeEvent } from '../features/editor/editor.component.js';
import type { PreviewUpdateEvent } from '../features/preview/preview.component.js';
import styles from './root.component.scss?inline';

/**
 * @element webdmx-root
 */
@customElement('webdmx-root')
export class Root extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #dmx = new DMX();
  #driver!: SerialDriver;

  #transferringTimeout?: number;
  #handleTransferring = this.handleTransferring.bind(this);

  @state() private data!: Data;
  @state() private selectedUniverseIndex?: number;
  @state() private driverNames = DMX.driverNames;

  @state() private loaded = false;
  @state() private idle = true;
  @state() private connected = false;

  @eventOptions({ passive: true })
  private async handleModeChange() {
    this.data = {
      ...this.data,
      activeView: this.data.activeView === 'editor' ? 'preview' : 'editor',
    };
    await saveData(this.data);
  }

  @eventOptions({ passive: true })
  private handleTransferring({ detail }: CustomEvent<boolean>) {
    // positive transferring events are set immediately, but
    // negative transferring events are delayed to prevent flickering
    if (detail) {
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
    const driverName = this.data.universes[this.selectedUniverseIndex!]!.driver;
    const driver = await DMX.loadDriver(driverName);
    if (!driver) throw new Error(`Driver "${driverName}" not found`);
    this.#driver = new driver();

    // create universe and connect
    const universe = this.data.universes[this.selectedUniverseIndex!]?.label ?? 'default';
    await this.#dmx.addUniverse(universe, this.#driver);
    this.#driver.addEventListener('transferring', this.#handleTransferring);
    this.connected = true;
  }

  @eventOptions({ passive: true })
  private async handleDisconnect() {
    const universe = this.data.universes[this.selectedUniverseIndex!]?.label ?? 'default';
    this.#dmx.updateAll(universe, 0);

    await new Promise((resolve) => setTimeout(resolve, 500));
    this.#driver.removeEventListener('transferring', this.#handleTransferring);
    await this.#dmx.close();
    this.connected = false;
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
  private handlePreviewUpdate({ detail: { name, channels } }: PreviewUpdateEvent) {
    this.#dmx.update(name, channels);
  }

  override async connectedCallback() {
    super.connectedCallback();

    // load stored data (or initialize with empty data)
    this.data = await loadData();

    // pre-select the first universe if only one is available
    if (this.data.universes.length === 1 && this.selectedUniverseIndex === undefined) {
      this.selectedUniverseIndex = 0;
    }

    // prevent preview mode if no universes are configured
    if (!this.data.universes.length) {
      this.data = {
        ...this.data,
        activeView: 'editor',
      };
      await saveData(this.data);
    }

    // we're done loading
    this.loaded = true;
  }

  override async disconnectedCallback() {
    await this.#dmx.close();
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
                      ?selected="${driver === this.data.universes[this.selectedUniverseIndex!]?.driver}"
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
            ?disabled="${this.data.universes.length === 0}"
            ?active="${this.data.activeView === 'preview'}"
            @webdmx-switch:toggle="${this.handleModeChange}"
          >
            <span slot="off">Preview</span>
            <span slot="on">Edit</span>
          </webdmx-switch>
        </nav>

        ${this.data.activeView === 'editor'
          ? html`
              <webdmx-editor
                .universe="${this.data.universes[this.selectedUniverseIndex!]}"
                @webdmx-editor:change="${this.handleEditorChange}"
              ></webdmx-editor>
            `
          : html`
              <webdmx-preview
                ?connected="${this.connected}"
                .universe="${this.data.universes[this.selectedUniverseIndex!]}"
                @webdmx-preview:update="${this.handlePreviewUpdate}"
              ></webdmx-preview>
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
