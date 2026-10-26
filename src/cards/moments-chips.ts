import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { domainOf, fireMoreInfo, minutesSince, nameOf } from "../helpers";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

interface ChipsConfig extends LovelaceCardConfig {
  battery_threshold?: number;
  exclude?: string[];
}

interface Chip {
  entityId: string;
  label: string;
  severity: "alert" | "warn";
}

const OPENINGS = ["door", "window", "garage_door", "opening"];

/** Exceptions only: open doors, low batteries, problems. Renders nothing when all is well. */
@customElement("moments-chips")
export class MomentsChips extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: ChipsConfig;

  setConfig(config: ChipsConfig) {
    this.config = { battery_threshold: 15, ...config };
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }

  private chips(): Chip[] {
    if (!this.hass) return [];
    const exclude = new Set(this.config.exclude ?? []);
    const chips: Chip[] = [];
    for (const entity of Object.values(this.hass.states)) {
      const id = entity.entity_id;
      if (exclude.has(id)) continue;
      const dc = entity.attributes.device_class;
      if (domainOf(id) === "binary_sensor" && entity.state === "on") {
        if (OPENINGS.includes(dc)) {
          chips.push({ entityId: id, label: `${nameOf(entity)} open ${minutesSince(entity.last_changed)} min`, severity: "alert" });
        } else if (dc === "problem" || dc === "moisture" || dc === "smoke" || dc === "gas") {
          chips.push({ entityId: id, label: nameOf(entity), severity: "alert" });
        }
      } else if (domainOf(id) === "sensor" && dc === "battery") {
        const level = Number(entity.state);
        if (!Number.isNaN(level) && level < this.config.battery_threshold!) {
          chips.push({ entityId: id, label: `${nameOf(entity)} ${level}%`, severity: "warn" });
        }
      }
    }
    return chips.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "alert" ? -1 : 1));
  }

  render() {
    const chips = this.chips();
    this.toggleAttribute("hidden", chips.length === 0);
    if (!chips.length) return nothing;
    return html`<div class="chips">
      ${chips.map(
        (c) => html`<button class="chip ${c.severity}" @click=${() => fireMoreInfo(this, c.entityId)}>
          <i></i>${c.label}
        </button>`,
      )}
    </div>`;
  }

  static styles = [
    tokens,
    css`
      :host([hidden]) {
        display: none;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 14px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 14px;
      }
      .chip i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
      }
      .alert {
        background: var(--moments-alert-soft);
        color: var(--moments-alert);
      }
      .warn {
        background: var(--moments-warn-soft);
        color: var(--moments-warn);
      }
    `,
  ];
}
