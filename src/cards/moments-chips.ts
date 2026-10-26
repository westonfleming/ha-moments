import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { fireMoreInfo, haptic } from "../helpers";
import { chipsFor, type Chip } from "../exceptions";
import type { FinishedEntity, Schedule } from "../config";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

interface ChipsConfig extends LovelaceCardConfig {
  battery_threshold?: number;
  exclude?: string[];
  finished?: FinishedEntity[];
  schedules?: Schedule[];
  schedules_off_after_hours?: number;
}

const NARROW_BELOW = 500;

const isStringList = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === "string");

/** Exceptions only: open doors, low batteries, problems. Renders nothing when all is well. */
@customElement("moments-chips")
export class MomentsChips extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: ChipsConfig;
  @state() private now = new Date();
  private timer?: ReturnType<typeof setInterval>;
  private resizer?: ResizeObserver;

  static getStubConfig() {
    return {};
  }

  setConfig(config: ChipsConfig) {
    if (!config) throw new Error("moments-chips: missing configuration");
    const t = config.battery_threshold;
    if (t !== undefined && (typeof t !== "number" || t < 0 || t > 100))
      throw new Error("moments-chips: battery_threshold must be a number from 0 to 100");
    if (config.exclude !== undefined && !isStringList(config.exclude))
      throw new Error("moments-chips: exclude must be a list of entity ids");
    if (config.finished !== undefined) {
      if (!Array.isArray(config.finished)) throw new Error("moments-chips: finished must be a list");
      for (const f of config.finished)
        if (typeof f?.entity !== "string" || typeof f?.state !== "string")
          throw new Error("moments-chips: each finished item needs an entity and a state");
    }
    if (config.schedules !== undefined) {
      if (!Array.isArray(config.schedules)) throw new Error("moments-chips: schedules must be a list");
      for (const s of config.schedules)
        if (typeof s?.name !== "string" || typeof s?.automation !== "string")
          throw new Error("moments-chips: each schedule needs a name and an automation");
    }
    const h = config.schedules_off_after_hours;
    if (h !== undefined && (typeof h !== "number" || h < 0))
      throw new Error("moments-chips: schedules_off_after_hours must be a positive number of hours");
    this.config = config;
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }

  connectedCallback() {
    super.connectedCallback();
    this.now = new Date();
    this.timer = setInterval(() => (this.now = new Date()), 60_000);
    if (typeof ResizeObserver !== "undefined") {
      this.resizer = new ResizeObserver(([entry]) =>
        this.toggleAttribute("narrow", entry.contentRect.width < NARROW_BELOW),
      );
      this.resizer.observe(this);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.timer);
    this.timer = undefined;
    this.resizer?.disconnect();
    this.resizer = undefined;
  }

  private open(chip: Chip) {
    haptic(this, "selection");
    fireMoreInfo(this, chip.entityId);
  }

  render() {
    const chips = this.hass && this.config ? chipsFor(this.hass, this.config, this.now) : [];
    this.toggleAttribute("hidden", chips.length === 0);
    if (!chips.length) return nothing;
    return html`<div class="chips" role="list">
      ${chips.map(
        (c) => html`<button class="chip ${c.severity}" role="listitem" @click=${() => this.open(c)}>
          <i></i>${c.label}
        </button>`,
      )}
    </div>`;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      :host([hidden]) {
        display: none;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      :host([narrow]) .chips {
        flex-wrap: nowrap;
        overflow-x: auto;
        scroll-snap-type: x proximity;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-x: contain;
      }
      :host([narrow]) .chips::-webkit-scrollbar {
        display: none;
      }
      :host([narrow]) .chip {
        flex: none;
        scroll-snap-align: start;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 14px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 14px;
        white-space: nowrap;
      }
      .chip i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
        flex: none;
      }
      .alert {
        background: var(--moments-alert-soft);
        color: var(--moments-alert);
      }
      .warn {
        background: var(--moments-warn-soft);
        color: var(--moments-warn);
      }
      .info {
        background: color-mix(in srgb, var(--moments-fg) 7%, transparent);
        color: var(--moments-muted);
        font-weight: 500;
      }
    `,
  ];
}
