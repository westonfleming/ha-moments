import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { domainOf, fireMoreInfo, isVisible, nameOf } from "../helpers";
import type { HassEntity, HomeAssistant, LovelaceCardConfig } from "../types";

interface OnNowConfig extends LovelaceCardConfig {
  domains?: string[];
  exclude?: string[];
}

const DEFAULT_DOMAINS = ["light", "switch", "fan", "cover"];

const isOn = (e: HassEntity) =>
  domainOf(e.entity_id) === "cover" ? e.state === "open" : e.state === "on";

/** Everything that is on or open right now. Shrinks to nothing as the house goes quiet. */
@customElement("moments-on-now")
export class MomentsOnNow extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: OnNowConfig;

  setConfig(config: OnNowConfig) {
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  private entities(): HassEntity[] {
    if (!this.hass) return [];
    const domains = this.config.domains ?? DEFAULT_DOMAINS;
    const exclude = new Set(this.config.exclude ?? []);
    return Object.values(this.hass.states)
      .filter((e) => domains.includes(domainOf(e.entity_id)))
      .filter((e) => !exclude.has(e.entity_id) && isVisible(this.hass!, e.entity_id) && isOn(e))
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  }

  private toggle(e: HassEntity) {
    const domain = domainOf(e.entity_id);
    if (domain === "cover") this.hass?.callService("cover", "close_cover", { entity_id: e.entity_id });
    else this.hass?.callService("homeassistant", "turn_off", { entity_id: e.entity_id });
  }

  private allOff(entities: HassEntity[]) {
    const lights = entities.filter((e) => domainOf(e.entity_id) === "light").map((e) => e.entity_id);
    if (lights.length) this.hass?.callService("light", "turn_off", { entity_id: lights });
  }

  render() {
    const entities = this.entities();
    if (!entities.length) return html`<div class="quiet">All quiet</div>`;
    const hasLights = entities.some((e) => domainOf(e.entity_id) === "light");
    return html`<div class="list">
      ${entities.map(
        (e) => html`<div class="row">
          <button class="name" @click=${() => fireMoreInfo(this, e.entity_id)}>
            <span class="dot"></span>${nameOf(e)}
          </button>
          <button class="tog" aria-label="Turn off ${nameOf(e)}" @click=${() => this.toggle(e)}></button>
        </div>`,
      )}
      ${hasLights
        ? html`<button class="all" @click=${() => this.allOff(entities)}>All lights off</button>`
        : nothing}
    </div>`;
  }

  static styles = [
    tokens,
    css`
      .list,
      .quiet {
        background: var(--moments-tile);
        border-radius: var(--moments-radius);
        padding: 4px 14px;
      }
      .quiet {
        padding: 14px;
        color: var(--moments-muted);
      }
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid var(--divider-color);
      }
      .name {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 0;
        background: none;
        text-align: left;
        min-width: 0;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--moments-on);
        flex: none;
      }
      .tog {
        width: 40px;
        height: 24px;
        border-radius: 12px;
        background: var(--moments-on);
        position: relative;
        flex: none;
      }
      .tog::after {
        content: "";
        position: absolute;
        right: 3px;
        top: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
      }
      .all {
        width: 100%;
        padding: 12px 0;
        background: none;
        color: var(--moments-muted);
        text-align: left;
      }
    `,
  ];
}
