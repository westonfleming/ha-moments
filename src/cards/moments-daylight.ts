import { LitElement, html, css, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { panel, tokens } from "../styles/tokens";
import { fireMoreInfo, isEntityId } from "../helpers";
import { formatNumber, formatTime, startOfDay } from "../format";
import { HistoryLoader, numeric, type NumericPoint, type Period } from "../data/history";
import { WidthController, linePoints, linear } from "../charts";
import { DEFAULT_DARK_BELOW } from "../context/daylight";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

interface DaylightConfig extends LovelaceCardConfig {
  /** Outdoor illuminance sensor (lux). */
  entity: string;
  /** Below this it counts as dark. Default 50, the same as the dashboard's dark_below. */
  dark_below?: number;
  title?: string;
}

const H = 200;
const LEFT = 52;
const RIGHT = 74;
const TOP = 10;
const BOTTOM = 26;
const DECADES = 5;

/** Times the light crossed the dark line, oldest first. `dark` is the state after the crossing. */
export const crossings = (points: NumericPoint[], darkBelow: number) => {
  const out: { t: number; dark: boolean }[] = [];
  let dark: boolean | undefined;
  for (const p of points) {
    const d = p.v < darkBelow;
    if (dark !== undefined && d !== dark) out.push({ t: p.t, dark: d });
    dark = d;
  }
  return out;
};

/** Dark stretches between `from` and `now`. */
export const darkPeriods = (points: NumericPoint[], darkBelow: number, from: number, now: number): Period[] => {
  const before = [...points].reverse().find((p) => p.t <= from);
  const after = points.filter((p) => p.t > from && p.t <= now);
  const first = before ?? after[0];
  if (!first) return [];
  const out: Period[] = [];
  let start = first.v < darkBelow ? Math.max(from, first.t) : undefined;
  for (const p of after) {
    const dark = p.v < darkBelow;
    if (dark && start === undefined) start = p.t;
    if (!dark && start !== undefined) {
      out.push({ start, end: p.t });
      start = undefined;
    }
  }
  if (start !== undefined) out.push({ start, end: now });
  return out;
};

const log10 = (v: number) => Math.log(Math.max(1, v)) / Math.LN10;

/** Today's outdoor light on a log scale, the dark line, and when it got dark or light. */
@customElement("moments-daylight")
export class MomentsDaylight extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: DaylightConfig;
  private history = new HistoryLoader(this);
  private size = new WidthController(this);

  static getStubConfig(hass?: HomeAssistant) {
    const lux = Object.entries(hass?.states ?? {}).find(([, e]) => e.attributes.device_class === "illuminance")?.[0];
    return { entity: lux ?? "sensor.outdoor_illuminance" };
  }

  setConfig(config: DaylightConfig) {
    if (!config || !isEntityId(config.entity)) throw new Error("moments-daylight: entity must be an illuminance sensor");
    if (config.dark_below !== undefined && (typeof config.dark_below !== "number" || config.dark_below <= 0))
      throw new Error("moments-daylight: dark_below must be a positive number (lux)");
    this.config = config;
  }

  getCardSize() {
    return 4;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  protected updated() {
    if (this.config) this.history.load(this.hass, [this.config.entity], new Date(startOfDay(new Date()).getTime() - 3600_000));
  }

  render() {
    if (!this.hass || !this.config) return nothing;
    const entity = this.hass.states[this.config.entity];
    const darkBelow = this.config.dark_below ?? DEFAULT_DARK_BELOW;
    const W = this.size.inner();
    const now = Date.now();
    const from = startOfDay(new Date()).getTime();
    const to = from + 24 * 3600_000;
    const points = numeric(this.history.data[this.config.entity]);
    const current = Number(entity?.state);
    const isDark = Number.isFinite(current) && current < darkBelow;
    const today = crossings(points, darkBelow).filter((c) => c.t >= from);
    const last = today[today.length - 1];
    const firstLight = today.find((c) => !c.dark);
    const x = linear(from, to, LEFT, W - RIGHT);
    const y = (v: number) => H - BOTTOM - (log10(v) / DECADES) * (H - BOTTOM - TOP);
    const nowX = x(Math.min(now, to));
    const locale = this.hass.locale;
    return html`<div class="panel">
      <div class="head">
        <h2>${this.config.title ?? "Daylight"}</h2>
        <div class="pills">
          <button class="pill num" @click=${() => fireMoreInfo(this, this.config.entity)}>Now ${formatNumber(entity?.state)} lx</button>
          ${last
            ? html`<span class="pill ${last.dark ? "dark" : ""}">${last.dark ? "Dark" : "Light"} since ${formatTime(new Date(last.t), locale)}</span>`
            : isDark
              ? html`<span class="pill dark">Dark</span>`
              : nothing}
          ${last?.dark && firstLight
            ? html`<span class="pill">Got light ${formatTime(new Date(firstLight.t), locale)}</span>`
            : nothing}
        </div>
      </div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Outdoor light today on a log scale with the dark line at ${darkBelow} lux">
        ${darkPeriods(points, darkBelow, from, Math.min(now, to)).map(
          (p) => svg`<rect class="night" x=${x(p.start)} y=${TOP} width=${Math.max(0, x(p.end) - x(p.start))} height=${H - BOTTOM - TOP}></rect>`,
        )}
        ${[0, 1, 2, 3, 4, 5].map(
          (d) => svg`<line class="grid" x1=${LEFT} x2=${W - RIGHT} y1=${y(10 ** d)} y2=${y(10 ** d)}></line>
            <text x=${LEFT - 8} y=${y(10 ** d) + 4} text-anchor="end">${["1", "10", "100", "1k", "10k", "100k"][d]}</text>`,
        )}
        <line class="threshold" x1=${LEFT} x2=${W - RIGHT} y1=${y(darkBelow)} y2=${y(darkBelow)}></line>
        <text class="threshold-label" x=${W - RIGHT + 6} y=${y(darkBelow) + 4}>Dark &lt; ${darkBelow}</text>
        <polyline class="lux" points=${linePoints(points, x, y, from, Math.min(now, to))}></polyline>
        ${Number.isFinite(current) ? svg`<circle class="now" cx=${nowX} cy=${y(current)} r="5"></circle>` : nothing}
        ${(W < 420 ? [0, 12, 24] : [0, 6, 12, 18, 24]).map(
          (h) => svg`<text x=${x(from + h * 3600_000)} y=${H - 6} text-anchor="middle">${String(h).padStart(2, "0")}:00</text>`,
        )}
      </svg>
    </div>`;
  }

  static styles = [
    tokens,
    panel,
    css`
      .pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }
      .night {
        fill: color-mix(in srgb, var(--moments-purple) 8%, transparent);
      }
      .threshold {
        stroke: var(--moments-purple);
        stroke-width: 1.5;
        stroke-dasharray: 5 5;
      }
      svg.chart .threshold-label {
        fill: var(--moments-purple);
        font-weight: 700;
        font-size: 12px;
      }
      .lux {
        fill: none;
        stroke: var(--moments-sun);
        stroke-width: 3;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
      .now {
        fill: var(--moments-sun);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "moments-daylight": MomentsDaylight;
  }
}
