import { LitElement, html, css, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { panel, tokens } from "../styles/tokens";
import { fireMoreInfo, isEntityId } from "../helpers";
import { formatDay, formatNumber, formatSpan, formatTime, formatWeekday, startOfDay } from "../format";
import { HistoryLoader, numeric, periodsWhere, type Point, type Period } from "../data/history";
import { WidthController, extent, linePoints, linear, niceTicks } from "../charts";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

interface InternetConfig extends LovelaceCardConfig {
  title?: string;
  /** Connectivity sensor, "on" while online (e.g. from the Ping integration). */
  online?: string;
  download?: string;
  upload?: string;
  ping?: string;
  /** Days of speeds on the chart. Default 7. */
  days?: number;
  /** Days of outages listed. Default 30. */
  outage_days?: number;
  /** Outages listed at most. Default 5. */
  max_outages?: number;
}

const H = 150;
const LEFT = 44;
const RIGHT = 6;
const TOP = 8;
const BOTTOM = 24;

/** Offline stretches, newest first. "unavailable" and "unknown" don't count as outages. */
export const outages = (points: Point[], now: number): Period[] =>
  periodsWhere(points, (s) => s === "off", now).reverse();

/** Internet status, latest speeds, a chart of download speed and recent outages. */
@customElement("moments-internet")
export class MomentsInternet extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: InternetConfig;
  private history = new HistoryLoader(this, 10 * 60_000);
  private size = new WidthController(this);

  static getStubConfig() {
    return { online: "binary_sensor.internet", download: "sensor.speedtest_download", upload: "sensor.speedtest_upload", ping: "sensor.speedtest_ping" };
  }

  setConfig(config: InternetConfig) {
    if (!config) throw new Error("moments-internet: missing configuration");
    for (const key of ["online", "download", "upload", "ping"] as const)
      if (config[key] !== undefined && !isEntityId(config[key])) throw new Error(`moments-internet: ${key} must be an entity id`);
    if (!config.online && !config.download) throw new Error("moments-internet: add online or download");
    for (const key of ["days", "outage_days", "max_outages"] as const) {
      const v = config[key];
      if (v !== undefined && (typeof v !== "number" || v < 1)) throw new Error(`moments-internet: ${key} must be a number of at least 1`);
    }
    this.config = config;
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  private window() {
    return Math.max(this.config.days ?? 7, this.config.outage_days ?? 30);
  }

  protected updated() {
    if (!this.config) return;
    const ids = [this.config.online, this.config.download].filter((x): x is string => !!x);
    this.history.load(this.hass, ids, new Date(startOfDay(new Date()).getTime() - this.window() * 86400_000));
  }

  private speed(key: "download" | "upload" | "ping", label: string) {
    const id = this.config[key];
    if (!id) return nothing;
    const e = this.hass!.states[id];
    return html`<button class="stat" @click=${() => fireMoreInfo(this, id)}>
      <span class="k">${label}</span>
      <span class="v big">${formatNumber(e?.state)} <span class="unit">${e?.attributes.unit_of_measurement ?? ""}</span></span>
    </button>`;
  }

  private chart(now: number, offline: Period[]) {
    const id = this.config.download;
    if (!id) return nothing;
    const W = this.size.inner();
    const days = this.config.days ?? 7;
    const from = startOfDay(new Date(now - (days - 1) * 86400_000)).getTime();
    const points = numeric(this.history.data[id]).filter((p) => p.t >= from - 86400_000);
    const ext = extent(points.map((p) => p.v));
    if (!ext) return nothing;
    const ticks = niceTicks(0, ext[1], 2);
    const x = linear(from, now, LEFT, W - RIGHT);
    const y = linear(0, ticks[ticks.length - 1], H - BOTTOM, TOP);
    const dayStarts = Array.from({ length: days }, (_, i) => from + i * 86400_000);
    return html`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Download speed over the last ${days} days">
      ${ticks.map(
        (t) => svg`<line class="grid" x1=${LEFT} x2=${W - RIGHT} y1=${y(t)} y2=${y(t)}></line>
          <text x=${LEFT - 8} y=${y(t) + 4} text-anchor="end">${t}</text>`,
      )}
      ${offline
        .filter((o) => o.end >= from)
        .map((o) => svg`<rect class="out" x=${x(Math.max(o.start, from))} y=${TOP} width=${Math.max(3, x(o.end) - x(Math.max(o.start, from)))} height=${H - BOTTOM - TOP}></rect>`)}
      <polyline class="speed" points=${linePoints(points, x, y, from, now)}></polyline>
      ${dayStarts.map(
        (d) => svg`<text x=${x(Math.min(d + 43200_000, now))} y=${H - 6} text-anchor="middle">${formatWeekday(new Date(d), this.hass?.locale)}</text>`,
      )}
    </svg>`;
  }

  render() {
    if (!this.hass || !this.config) return nothing;
    const now = Date.now();
    const c = this.config;
    const online = c.online ? this.hass.states[c.online] : undefined;
    const since = online ? (now - new Date(online.last_changed).getTime()) / 60000 : 0;
    const outageFrom = now - (c.outage_days ?? 30) * 86400_000;
    const offline = c.online ? outages(this.history.data[c.online] ?? [], now).filter((o) => o.end >= outageFrom) : [];
    const listed = offline.slice(0, c.max_outages ?? 5);
    const locale = this.hass.locale;
    return html`<div class="panel">
      <div class="head">
        <h2>${c.title ?? "Internet"}</h2>
        ${online
          ? online.state === "off"
            ? html`<span class="pill alert"><i></i>Offline ${formatSpan(since)}</span>`
            : online.state === "on"
              ? html`<span class="pill ok"><i></i>Online ${formatSpan(since)}</span>`
              : html`<span class="pill">Status unknown</span>`
          : nothing}
      </div>
      ${c.download || c.upload || c.ping
        ? html`<div class="stats">${this.speed("download", "Download")}${this.speed("upload", "Upload")}${this.speed("ping", "Ping")}</div>`
        : nothing}
      ${this.chart(now, offline)}
      ${c.online
        ? html`<div class="log">
            <div class="label">Outages, ${c.outage_days ?? 30} days</div>
            ${listed.length
              ? listed.map(
                  (o) => html`<div class="row out-row">
                    <span class="d">${formatDay(new Date(o.start), locale)}</span>
                    <span class="sub">${formatTime(new Date(o.start), locale)} – ${o.end >= now ? "now" : formatTime(new Date(o.end), locale)}</span>
                    <span class="dur">${formatSpan((o.end - o.start) / 60000)}</span>
                  </div>`,
                )
              : html`<div class="row out-row"><span class="empty">None recorded</span></div>`}
          </div>`
        : nothing}
    </div>`;
  }

  static styles = [
    tokens,
    panel,
    css`
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
        gap: 10px;
      }
      button.stat {
        text-align: left;
      }
      .big {
        font-size: 24px;
      }
      .unit {
        font-size: 13px;
        color: var(--moments-muted);
        font-weight: 600;
      }
      .out {
        fill: var(--moments-alert);
        opacity: 0.7;
      }
      .speed {
        fill: none;
        stroke: var(--moments-blue);
        stroke-width: 2.5;
        stroke-linejoin: round;
      }
      .log {
        display: flex;
        flex-direction: column;
      }
      .log .label {
        padding-bottom: 4px;
      }
      .out-row {
        grid-template-columns: minmax(0, 1fr) auto 72px;
        min-height: 38px;
      }
      .d {
        font-weight: 600;
      }
      .dur {
        text-align: right;
        font-weight: 700;
        color: var(--moments-alert);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "moments-internet": MomentsInternet;
  }
}
