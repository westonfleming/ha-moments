import { LitElement, html, css, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { tokens } from "../styles/tokens";
import { resolveSurface, surfaceStyles, validateSurface, type SurfaceConfig } from "../styles/surface";
import { fireMoreInfo, isEntityId, nameOf } from "../helpers";
import { HistoryLoader, numeric } from "../data/history";
import { trend } from "../climate";
import { DEFAULT_LEVELS, GLYPH, KIND_LABEL, kindOf, levelColor, levelFor, resample, sparkPath, validateLevels, type Level } from "../metrics";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

interface MetricConfig extends LovelaceCardConfig, SurfaceConfig {
  entity: string;
  name?: string;
  /** Hours of history for the sparkline. 0 or false hides it. Default 24. */
  sparkline?: number | false;
  /** Words for value ranges, e.g. [{ below: 800, label: Good, color: good }, { label: High, color: poor }]. */
  levels?: Level[];
  /** Decimal places. Default: 1 for temperature, else 0. */
  decimals?: number;
}

const TREND_WORD = { rising: "Rising", falling: "Falling", steady: "Steady" } as const;

/** One reading, value first: a big number, a status word and an optional sparkline. */
@customElement("moments-metric")
export class MomentsMetric extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: MetricConfig;
  private history = new HistoryLoader(this);

  static getStubConfig(hass: HomeAssistant) {
    const entity =
      Object.keys(hass?.states ?? {}).find((id) => id.startsWith("sensor.") && hass.states[id].attributes.device_class === "temperature") ??
      "sensor.living_room_temperature";
    return { entity };
  }

  setConfig(config: MetricConfig) {
    if (!config || !isEntityId(config.entity)) throw new Error("moments-metric: entity must be an entity id");
    if (config.sparkline !== undefined && config.sparkline !== false && (typeof config.sparkline !== "number" || config.sparkline < 0))
      throw new Error("moments-metric: sparkline must be a number of hours or false");
    if (config.levels !== undefined) validateLevels("moments-metric", config.levels);
    if (config.decimals !== undefined && (typeof config.decimals !== "number" || config.decimals < 0))
      throw new Error("moments-metric: decimals must be 0 or more");
    validateSurface("moments-metric", config);
    this.config = config;
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: 6, min_columns: 3, rows: 2, min_rows: 2 };
  }

  private get hours() {
    const s = this.config.sparkline;
    return s === false ? 0 : s ?? 24;
  }

  protected updated() {
    if (this.config && this.hours) this.history.load(this.hass, [this.config.entity], new Date(Date.now() - this.hours * 3600_000));
  }

  protected render() {
    if (!this.config || !this.hass) return nothing;
    const c = this.config;
    const e = this.hass.states[c.entity];
    const kind = kindOf(e);
    const name = c.name ?? (KIND_LABEL[kind] || (e ? nameOf(e) : c.entity));
    const value = parseFloat(e?.state ?? "");
    const ok = Number.isFinite(value);
    const decimals = c.decimals ?? (kind === "temperature" ? 1 : 0);
    const unit = e?.attributes.unit_of_measurement ?? "";
    const now = Date.now();
    const points = numeric(this.history.data[c.entity]);
    const level = levelFor(value, c.levels ?? DEFAULT_LEVELS[kind]);
    const status = !ok ? "Unavailable" : level?.label ?? (kind === "temperature" ? TREND_WORD[trend(points, value, now)] : "");
    const color = level ? levelColor(level.color) : kind === "temperature" ? "var(--moments-ok)" : "var(--moments-muted)";
    const series = this.hours ? resample(points, now - this.hours * 3600_000, now, 32) : [];
    if (series.length && ok) series[series.length - 1] = value;
    const sp = sparkPath(series);
    const { surface, style } = resolveSurface(this, c);
    const dark = this.hass.themes?.darkMode ? " dark" : "";
    const shown = ok ? value.toLocaleString(this.hass.locale?.language, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : "—";
    return html`
      <ha-card
        class="${surface}${dark}"
        style="${style};--level:${color}"
        role="button"
        tabindex="0"
        aria-label="${name} ${shown} ${unit} ${status}"
        @click=${() => fireMoreInfo(this, c.entity)}
        @keydown=${(ev: KeyboardEvent) => ev.key === "Enter" && fireMoreInfo(this, c.entity)}
      >
        <div class="label">${unsafeSVG(GLYPH[kind])}<span>${name}</span></div>
        <div class="value">${shown}<span class="unit">${unit}</span></div>
        <div class="status">${status}</div>
        ${sp
          ? html`<svg class="spark" viewBox="0 0 56 22" aria-hidden="true">
              ${svg`<path d="${sp.area}" fill="var(--level)" opacity=".12"></path>
              <path d="${sp.d}" fill="none" stroke="var(--level)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
              <circle cx="${sp.end[0]}" cy="${sp.end[1]}" r="2" fill="var(--level)"></circle>`}
            </svg>`
          : nothing}
      </ha-card>
    `;
  }

  static styles = [
    tokens,
    surfaceStyles,
    css`
      :host {
        display: block;
        height: 100%;
      }
      ha-card {
        height: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        position: relative;
        overflow: hidden;
        display: grid;
        align-content: center;
        gap: 2px;
        cursor: pointer;
        color: var(--moments-fg);
        border-radius: var(--moments-radius);
      }
      ha-card:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      .label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--moments-muted);
      }
      .label svg {
        width: 14px;
        height: 14px;
        flex: none;
      }
      .value {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
      }
      .unit {
        font-size: 13px;
        font-weight: 600;
        color: var(--moments-muted);
        margin-left: 3px;
      }
      .status {
        font-size: 12px;
        font-weight: 600;
        color: var(--level);
      }
      .spark {
        position: absolute;
        right: 10px;
        bottom: 10px;
        width: 64px;
        height: 25px;
      }
    `,
  ];
}
