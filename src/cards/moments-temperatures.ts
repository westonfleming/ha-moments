import { LitElement, html, css, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { panel, tokens } from "../styles/tokens";
import { fireMoreInfo, isEntityId, nameOf } from "../helpers";
import { formatNumber, formatTime, startOfDay } from "../format";
import { HistoryLoader, numeric } from "../data/history";
import { WidthController, extent, linePoints, linear, niceTicks } from "../charts";
import { rangeSince, trend } from "../climate";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

interface RoomSensor {
  entity: string;
  name?: string;
}

interface TemperaturesConfig extends LovelaceCardConfig {
  title?: string;
  /** Outdoor temperature sensor, shown first and in blue. */
  outside?: string;
  rooms?: (string | RoomSensor)[];
  /** Hours shown on the chart. Default 24; 0 hides the chart. */
  hours?: number;
  /** "grid" wraps tiles onto rows (default); "row" keeps them in one row, swiping sideways when they don't fit. */
  layout?: "grid" | "row";
}

const SERIES = ["--moments-sun", "--moments-purple", "--moments-teal", "--moments-pink", "--moments-moon"];
const H = 190;
const LEFT = 40;
const RIGHT = 8;
const TOP = 10;
const BOTTOM = 28;

interface Line {
  entity: string;
  name: string;
  color: string;
  outside: boolean;
}

/** Room and outdoor temperatures: now, today's range and trend, and a chart of the last day. */
@customElement("moments-temperatures")
export class MomentsTemperatures extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: TemperaturesConfig;
  private history = new HistoryLoader(this);
  private size = new WidthController(this);

  static getStubConfig(hass?: HomeAssistant) {
    const temps = Object.entries(hass?.states ?? {})
      .filter(([, e]) => e.attributes.device_class === "temperature")
      .map(([id]) => id)
      .slice(0, 4);
    return { rooms: temps.length ? temps : ["sensor.living_room_temperature"] };
  }

  setConfig(config: TemperaturesConfig) {
    if (!config) throw new Error("moments-temperatures: missing configuration");
    if (config.outside !== undefined && !isEntityId(config.outside))
      throw new Error("moments-temperatures: outside must be an entity id");
    if (config.rooms !== undefined) {
      if (!Array.isArray(config.rooms)) throw new Error("moments-temperatures: rooms must be a list");
      for (const r of config.rooms) {
        const id = typeof r === "string" ? r : r?.entity;
        if (!isEntityId(id)) throw new Error("moments-temperatures: each room needs a sensor entity id");
      }
    }
    if (!config.outside && !config.rooms?.length) throw new Error("moments-temperatures: add outside or rooms");
    if (config.hours !== undefined && (typeof config.hours !== "number" || config.hours < 0 || config.hours > 168))
      throw new Error("moments-temperatures: hours must be 0 to 168");
    if (config.layout !== undefined && config.layout !== "grid" && config.layout !== "row")
      throw new Error("moments-temperatures: layout must be grid or row");
    this.config = config;
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  private lines(): Line[] {
    const lines: Line[] = [];
    if (this.config.outside)
      lines.push({ entity: this.config.outside, name: "Outside", color: "var(--moments-blue)", outside: true });
    (this.config.rooms ?? []).forEach((r, i) => {
      const room = typeof r === "string" ? { entity: r } : r;
      const e = this.hass?.states[room.entity];
      lines.push({
        entity: room.entity,
        name: room.name ?? (e ? nameOf(e) : room.entity),
        color: `var(${SERIES[i % SERIES.length]})`,
        outside: false,
      });
    });
    return lines;
  }

  private start() {
    const hours = this.config.hours ?? 24;
    const midnight = startOfDay(new Date()).getTime();
    return new Date(Math.min(midnight, Date.now() - hours * 3600_000) - 3600_000);
  }

  protected updated() {
    if (this.config) this.history.load(this.hass, this.lines().map((l) => l.entity), this.start());
  }

  private chart(lines: Line[], now: number) {
    const W = this.size.inner();
    const hours = this.config.hours ?? 24;
    const from = now - hours * 3600_000;
    const series = lines.map((l) => ({ ...l, points: numeric(this.history.data[l.entity]) }));
    const values = series.flatMap((s) => s.points.filter((p) => p.t >= from - 3600_000).map((p) => p.v));
    const ext = extent(values);
    if (!ext) return nothing;
    const ticks = niceTicks(Math.floor(ext[0] - 1), Math.ceil(ext[1] + 1), 3);
    const x = linear(from, now, LEFT, W - RIGHT);
    const y = linear(ticks[0], ticks[ticks.length - 1], H - BOTTOM, TOP);
    const timeTicks = (W < 420 ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1]).map((f) => from + f * (now - from));
    return html`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Temperatures over the last ${hours} hours">
      ${ticks.map(
        (t) => svg`<line class="grid" x1=${LEFT} x2=${W - RIGHT} y1=${y(t)} y2=${y(t)}></line>
          <text x=${LEFT - 8} y=${y(t) + 4} text-anchor="end">${t}°</text>`,
      )}
      ${series.map(
        (s) => svg`<polyline points=${linePoints(s.points, x, y, from, now)} fill="none" stroke=${s.color}
          stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></polyline>`,
      )}
      ${timeTicks.map(
        (t, i) => svg`<text x=${x(t)} y=${H - 8} text-anchor=${i === 0 ? "start" : i === timeTicks.length - 1 ? "end" : "middle"}>${
          i === timeTicks.length - 1 ? "Now" : formatTime(new Date(t), this.hass?.locale)
        }</text>`,
      )}
    </svg>`;
  }

  render() {
    if (!this.hass || !this.config) return nothing;
    const now = Date.now();
    const midnight = startOfDay(new Date()).getTime();
    const lines = this.lines();
    const showChart = (this.config.hours ?? 24) > 0;
    return html`<div class="panel">
      <div class="head"><h2>${this.config.title ?? "Temperatures"}</h2><span class="sub">Range is today</span></div>
      <div class="tiles ${this.config.layout === "row" ? "row" : ""}">
        ${lines.map((l) => {
          const e = this.hass!.states[l.entity];
          const current = Number(e?.state);
          const points = numeric(this.history.data[l.entity]);
          const range = rangeSince(points, midnight, current);
          const unit = e?.attributes.unit_of_measurement ?? "°C";
          return html`<button class="tile ${l.outside ? "outside" : ""}" @click=${() => fireMoreInfo(this, l.entity)}>
            <span class="name">${showChart ? html`<i style="background:${l.color}"></i>` : nothing}${l.name}</span>
            <span class="value num">${formatNumber(e?.state, 1)}${unit.startsWith("°") ? "°" : ` ${unit}`}</span>
            <span class="sub num">${range ? `${formatNumber(range[0], 1)}–${formatNumber(range[1], 1)}°` : "–"} · ${trend(points, current, now)}</span>
          </button>`;
        })}
      </div>
      ${showChart ? this.chart(lines, now) : nothing}
    </div>`;
  }

  static styles = [
    tokens,
    panel,
    css`
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
      }
      .tiles.row {
        grid-auto-flow: column;
        grid-template-columns: none;
        grid-auto-columns: minmax(130px, 1fr);
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
      }
      .tiles.row::-webkit-scrollbar {
        display: none;
      }
      .tiles.row .tile {
        scroll-snap-align: start;
      }
      .tile {
        border-radius: var(--moments-inner-radius);
        background: var(--moments-raised);
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        text-align: left;
        min-width: 0;
      }
      .tile.outside {
        background: color-mix(in srgb, var(--moments-blue) 16%, var(--moments-tile));
      }
      .name {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 700;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .name i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex: none;
      }
      .value {
        font-size: 30px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "moments-temperatures": MomentsTemperatures;
  }
}
