import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { domainOf, nameOf } from "../helpers";
import { timeOfDay, type TimeOfDay } from "../context/time-of-day";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

export interface Intent {
  entity: string;
  name?: string;
  icon?: string;
  /** Times of day when this intent moves to the front. */
  when?: TimeOfDay[];
}

interface IntentsConfig extends LovelaceCardConfig {
  intents: Intent[];
  time_of_day_entity?: string;
}

/** A row of "what do you want to do" buttons, reordered by time of day. */
@customElement("moments-intents")
export class MomentsIntents extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: IntentsConfig;

  setConfig(config: IntentsConfig) {
    if (!Array.isArray(config.intents) || !config.intents.length) {
      throw new Error("moments-intents needs a list of intents");
    }
    this.config = config;
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }

  private ordered(): Intent[] {
    const tod = timeOfDay(this.hass, this.config.time_of_day_entity);
    const now = this.config.intents.filter((i) => i.when?.includes(tod));
    const rest = this.config.intents.filter((i) => !i.when?.includes(tod));
    return [...now, ...rest];
  }

  private run(intent: Intent) {
    const domain = domainOf(intent.entity);
    const service = domain === "automation" ? "trigger" : domain === "button" ? "press" : "turn_on";
    this.hass?.callService(domain, service, { entity_id: intent.entity });
  }

  render() {
    if (!this.hass) return html``;
    return html`<div class="intents">
      ${this.ordered().map((intent) => {
        const entity = this.hass!.states[intent.entity];
        const running = domainOf(intent.entity) === "script" && entity?.state === "on";
        return html`<button class="intent ${running ? "on" : ""}" @click=${() => this.run(intent)}>
          <ha-icon .icon=${intent.icon ?? entity?.attributes.icon ?? "mdi:palette"}></ha-icon>
          <span>${intent.name ?? (entity ? nameOf(entity) : intent.entity)}</span>
        </button>`;
      })}
    </div>`;
  }

  static styles = [
    tokens,
    css`
      .intents {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: var(--moments-gap);
      }
      .intent {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        padding: 14px;
        min-height: 88px;
        border-radius: var(--moments-radius);
        background: var(--moments-tile);
        color: var(--moments-fg);
        font-weight: 600;
        text-align: left;
        transition: transform 0.12s ease;
      }
      .intent:active {
        transform: scale(0.97);
      }
      .intent.on {
        background: var(--moments-on);
        color: #fff;
      }
      ha-icon {
        --mdc-icon-size: 22px;
      }
    `,
  ];
}
