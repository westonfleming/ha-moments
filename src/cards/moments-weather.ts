import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { panel, tokens } from "../styles/tokens";
import { fireMoreInfo, isEntityId } from "../helpers";
import { formatDay, formatNumber, formatWeekday } from "../format";
import { conditionText } from "./moments-header";
import { gustLevel, rangeBar, splitForecast, type ForecastDay } from "../weather";
import { weatherIcon, weatherIconStyles } from "../weather-icons";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

interface WeatherConfig extends LovelaceCardConfig {
  entity: string;
  /** Days after today to list, 0–7. Default 7. */
  days?: number;
  /** Gusts at or above this are highlighted, in the entity's wind unit. Default 50. */
  gust_warn?: number;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Today in detail, then the next days with rain, wind and gusts, and a low-to-high bar. */
@customElement("moments-weather")
export class MomentsWeather extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: WeatherConfig;
  @state() private forecast?: ForecastDay[];
  private unsubscribe?: Promise<(() => unknown) | void>;
  private subscribedTo?: string;

  static getStubConfig(hass?: HomeAssistant) {
    return { entity: Object.keys(hass?.states ?? {}).find((id) => id.startsWith("weather.")) ?? "weather.home" };
  }

  setConfig(config: WeatherConfig) {
    if (!config || !isEntityId(config.entity) || !config.entity.startsWith("weather."))
      throw new Error("moments-weather: entity must be a weather.* entity");
    const d = config.days;
    if (d !== undefined && (typeof d !== "number" || d < 0 || d > 7)) throw new Error("moments-weather: days must be 0 to 7");
    if (config.gust_warn !== undefined && typeof config.gust_warn !== "number")
      throw new Error("moments-weather: gust_warn must be a number");
    this.config = config;
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stop();
  }

  protected updated() {
    if (!this.hass?.connection || !this.config) return;
    if (this.subscribedTo === this.config.entity) return;
    this.stop();
    this.subscribedTo = this.config.entity;
    this.unsubscribe = this.hass.connection
      .subscribeMessage<{ forecast?: ForecastDay[] }>((msg) => (this.forecast = msg.forecast ?? []), {
        type: "weather/subscribe_forecast",
        forecast_type: "daily",
        entity_id: this.config.entity,
      })
      .catch(() => {
        this.forecast = [];
      });
  }

  private stop() {
    this.unsubscribe?.then((off) => off?.());
    this.unsubscribe = undefined;
    this.subscribedTo = undefined;
  }

  render() {
    if (!this.hass || !this.config) return nothing;
    const entity = this.hass.states[this.config.entity];
    if (!entity) return html`<div class="panel"><span class="empty">${this.config.entity} not found</span></div>`;
    const a = entity.attributes;
    const tempUnit = a.temperature_unit ?? "°";
    const windUnit = a.wind_speed_unit ?? "km/h";
    const rainUnit = a.precipitation_unit ?? "mm";
    const warn = this.config.gust_warn ?? 50;
    const { today, upcoming } = splitForecast(this.forecast, new Date(), this.config.days ?? 7);
    const gust = today?.wind_gust_speed ?? a.wind_gust_speed;
    const lows = upcoming.map((d) => d.templow ?? d.temperature ?? NaN);
    const highs = upcoming.map((d) => d.temperature ?? NaN);
    const min = Math.min(...lows.filter(Number.isFinite));
    const max = Math.max(...highs.filter(Number.isFinite));
    const deg = tempUnit.startsWith("°") ? "°" : ` ${tempUnit}`;

    return html`<div class="panel">
      <button class="today" @click=${() => fireMoreInfo(this, this.config.entity)}>
        ${weatherIcon(entity.state, 72, conditionText(entity.state))}
        <span class="now">
          <span class="sub">Today · ${formatDay(new Date(), this.hass.locale)}</span>
          <span class="temp num">${formatNumber(a.temperature)}${deg}
            <span class="cond">${capital(conditionText(entity.state))}</span></span>
          ${today
            ? html`<span class="sub hl">High ${formatNumber(today.temperature)}${deg} · Low ${formatNumber(today.templow)}${deg}</span>`
            : nothing}
        </span>
      </button>
      <div class="stats">
        ${today?.precipitation !== undefined
          ? html`<div class="stat"><span class="k">Rain</span><span class="v rain">${formatNumber(today.precipitation, 1)} ${rainUnit}</span></div>`
          : nothing}
        ${a.wind_speed !== undefined
          ? html`<div class="stat"><span class="k">Wind</span><span class="v">${formatNumber(a.wind_speed)} ${windUnit}</span></div>`
          : nothing}
        ${gust !== undefined
          ? html`<div class="stat"><span class="k">Max gust</span><span class="v ${gustLevel(gust, warn)}">${formatNumber(gust)} ${windUnit}</span></div>`
          : nothing}
        ${a.humidity !== undefined
          ? html`<div class="stat"><span class="k">Humidity</span><span class="v">${formatNumber(a.humidity)}%</span></div>`
          : nothing}
      </div>
      ${upcoming.length
        ? html`<div class="days">
            <div class="day label"><span>Day</span><span></span><span class="c"></span><span class="r">Rain</span><span class="r">Wind / gust</span><span></span><span class="bar-h">Low – high</span><span></span></div>
            ${upcoming.map((d) => {
              const lo = d.templow ?? d.temperature;
              const hi = d.temperature;
              const bar = lo !== undefined && hi !== undefined && Number.isFinite(min) ? rangeBar(lo, hi, min, max) : undefined;
              return html`<div class="day row">
                <span class="dn">${formatWeekday(new Date(d.datetime), this.hass!.locale)}</span>
                ${weatherIcon(d.condition, 28, conditionText(d.condition ?? ""))}
                <span class="c">${capital(conditionText(d.condition ?? ""))}</span>
                <span class="r ${(d.precipitation ?? 0) >= 5 ? "rain" : ""}">${d.precipitation ? `${formatNumber(d.precipitation, 1)} ${rainUnit}` : "–"}</span>
                <span class="r ${gustLevel(d.wind_gust_speed, warn)}">${formatNumber(d.wind_speed)}${d.wind_gust_speed !== undefined ? ` / ${formatNumber(d.wind_gust_speed)}` : ""}</span>
                <span class="lo">${formatNumber(lo)}°</span>
                <span class="track">${bar ? html`<i style="left:${bar.left}%;width:${bar.width}%"></i>` : nothing}</span>
                <span class="hi">${formatNumber(hi)}°</span>
              </div>`;
            })}
          </div>`
        : this.forecast === undefined
          ? html`<span class="empty">Loading forecast…</span>`
          : nothing}
    </div>`;
  }

  static styles = [
    tokens,
    panel,
    weatherIconStyles,
    css`
      .today {
        display: flex;
        align-items: center;
        gap: 16px;
        background: none;
        padding: 0;
        text-align: left;
      }
      .now {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .temp {
        font-size: 44px;
        font-weight: 800;
        letter-spacing: -0.04em;
        line-height: 1.05;
      }
      .cond {
        font-size: 17px;
        font-weight: 700;
        letter-spacing: 0;
      }
      .hl {
        font-weight: 600;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
        gap: 8px;
      }
      .rain {
        color: var(--moments-blue);
      }
      .mid {
        color: var(--moments-warn);
      }
      .high {
        color: var(--moments-alert);
      }
      .days {
        display: flex;
        flex-direction: column;
      }
      .day {
        display: grid;
        grid-template-columns: 40px 28px minmax(0, 1fr) 64px 76px 28px minmax(60px, 140px) 28px;
        gap: 10px;
        align-items: center;
      }
      .day.label {
        padding-bottom: 6px;
      }
      .dn {
        font-weight: 700;
      }
      .c {
        font-weight: 600;
        color: var(--moments-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .r,
      .lo {
        text-align: right;
        font-weight: 700;
        white-space: nowrap;
      }
      .lo {
        color: var(--moments-muted);
        font-weight: 600;
      }
      .hi {
        font-weight: 700;
      }
      .bar-h {
        text-align: center;
        white-space: nowrap;
      }
      .track {
        position: relative;
        height: 6px;
        border-radius: 3px;
        background: var(--moments-raised);
      }
      .track i {
        position: absolute;
        top: 0;
        bottom: 0;
        border-radius: 3px;
        background: linear-gradient(90deg, var(--moments-blue), var(--moments-sun));
      }
      @container (max-width: 520px) {
        .day {
          grid-template-columns: 34px 28px 0 64px 60px 22px minmax(36px, 1fr) 24px;
          gap: 8px;
        }
        .c {
          visibility: hidden;
        }
        .temp {
          font-size: 36px;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "moments-weather": MomentsWeather;
  }
}
