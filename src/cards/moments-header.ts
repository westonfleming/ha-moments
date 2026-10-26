import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { haptic, navigate } from "../helpers";
import { greeting, timeOfDay } from "../context/time-of-day";
import { daylight } from "../context/daylight";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

export interface HeaderConfig extends LovelaceCardConfig {
  time_of_day_entity?: string;
  illuminance_entity?: string;
  dark_below?: number;
  weather_entity?: string;
  temperature_entity?: string;
  area?: string;
  rooms_by_user?: Record<string, string>;
  schedules_path?: string;
}

type Locale = HomeAssistant["locale"];

/** The local time, honouring the HA profile's language and 12/24 hour setting. */
export const formatTime = (date: Date, locale?: Locale): string => {
  const format = locale?.time_format ?? "language";
  const lang = format === "system" ? undefined : locale?.language;
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  if (format === "12") opts.hour12 = true;
  if (format === "24") opts.hourCycle = "h23";
  try {
    return new Intl.DateTimeFormat(lang, opts).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, opts).format(date);
  }
};

const CONDITIONS: Record<string, string> = {
  "clear-night": "clear",
  fog: "foggy",
  "lightning-rainy": "thunderstorms",
  partlycloudy: "partly cloudy",
  rainy: "rain",
  snowy: "snow",
  "snowy-rainy": "sleet",
  "windy-variant": "windy",
  exceptional: "unusual weather",
};

/** A weather state in words, e.g. "partlycloudy" -> "partly cloudy". */
export const conditionText = (condition: string) =>
  CONDITIONS[condition] ?? condition.replace(/[-_]/g, " ");

const usable = (state?: string) => !!state && state !== "unavailable" && state !== "unknown";

const degrees = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.round(n)}°` : undefined;
};

/** The configured weather entity, or the first weather.* entity. */
export const weatherEntityId = (hass: HomeAssistant, configured?: string) =>
  configured ?? Object.keys(hass.states).find((id) => id.startsWith("weather."));

/** "21° inside · 14° out, clear"; parts that are missing or unavailable are left out. */
export const formatWeather = (hass: HomeAssistant, weatherEntity?: string, temperatureEntity?: string): string => {
  const parts: string[] = [];
  const inside = temperatureEntity ? hass.states[temperatureEntity] : undefined;
  const inTemp = usable(inside?.state) ? degrees(inside!.state) : undefined;
  if (inTemp) parts.push(`${inTemp} inside`);
  const weatherId = weatherEntityId(hass, weatherEntity);
  const weather = weatherId ? hass.states[weatherId] : undefined;
  if (weather && usable(weather.state)) {
    const outTemp = degrees(weather.attributes.temperature);
    const condition = conditionText(weather.state);
    parts.push(outTemp ? `${outTemp} out, ${condition}` : condition);
  }
  return parts.join(" · ");
};

/** The room this header speaks for: `area`, else the current user's room. */
export const roomLabel = (hass: HomeAssistant, config: HeaderConfig): string | undefined => {
  const areaId = config.area ?? (hass.user ? config.rooms_by_user?.[hass.user.id] : undefined);
  if (!areaId) return undefined;
  return hass.areas?.[areaId]?.name ?? areaId;
};

/** The greeting for the current time of day, e.g. "Good evening". */
export const greetingLine = (hass: HomeAssistant | undefined, config: HeaderConfig, now = new Date()) =>
  greeting(timeOfDay(hass, config.time_of_day_entity, now));

/** Everything under the greeting: room, temperatures, weather and "dark outside". */
export const subtitleParts = (hass: HomeAssistant, config: HeaderConfig): string[] => {
  const parts: string[] = [];
  const room = roomLabel(hass, config);
  if (room) parts.push(room);
  const weather = formatWeather(hass, config.weather_entity, config.temperature_entity);
  if (weather) parts.push(weather);
  if (daylight(hass, config.illuminance_entity, config.dark_below) === "dark") parts.push("dark outside");
  return parts;
};


const isEntityId = (v: unknown) => typeof v === "string" && /^[a-z0-9_]+\.[a-z0-9_]+$/.test(v);

/** Greeting, time and a one-line read of the house. */
@customElement("moments-header")
export class MomentsHeader extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: HeaderConfig;
  @state() private now = new Date();
  private alignTimer?: ReturnType<typeof setTimeout>;
  private minuteTimer?: ReturnType<typeof setInterval>;

  static getStubConfig(): Omit<HeaderConfig, "type"> {
    return {};
  }

  setConfig(config: HeaderConfig) {
    if (!config || typeof config !== "object") throw new Error("moments-header: invalid configuration");
    for (const key of ["time_of_day_entity", "illuminance_entity", "weather_entity", "temperature_entity"] as const) {
      if (config[key] !== undefined && !isEntityId(config[key])) {
        throw new Error(`moments-header: ${key} must be an entity id, e.g. sensor.example`);
      }
    }
    if (config.weather_entity && !config.weather_entity.startsWith("weather.")) {
      throw new Error("moments-header: weather_entity must be a weather.* entity");
    }
    if (config.dark_below !== undefined && (typeof config.dark_below !== "number" || Number.isNaN(config.dark_below))) {
      throw new Error("moments-header: dark_below must be a number (lux)");
    }
    if (config.area !== undefined && typeof config.area !== "string") {
      throw new Error("moments-header: area must be an area id");
    }
    if (
      config.rooms_by_user !== undefined &&
      (typeof config.rooms_by_user !== "object" || config.rooms_by_user === null || Array.isArray(config.rooms_by_user))
    ) {
      throw new Error("moments-header: rooms_by_user must map user ids to area ids");
    }
    if (config.schedules_path !== undefined && typeof config.schedules_path !== "string") {
      throw new Error("moments-header: schedules_path must be a path");
    }
    this.config = config;
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }

  connectedCallback() {
    super.connectedCallback();
    this.tick();
    const toNextMinute = 60000 - (Date.now() % 60000);
    this.alignTimer = setTimeout(() => {
      this.alignTimer = undefined;
      this.tick();
      this.minuteTimer = setInterval(() => this.tick(), 60000);
    }, toNextMinute);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.alignTimer);
    clearInterval(this.minuteTimer);
    this.alignTimer = this.minuteTimer = undefined;
  }

  private tick() {
    this.now = new Date();
  }

  protected willUpdate(changed: PropertyValues) {
    if (changed.has("hass")) this.now = new Date();
  }

  private openSchedules() {
    haptic(this, "selection");
    navigate(this.config.schedules_path!);
  }

  render() {
    if (!this.hass || !this.config) return nothing;
    const subtitle = subtitleParts(this.hass, this.config);
    return html`<header>
      <div class="text">
        <div class="time">${formatTime(this.now, this.hass.locale)}</div>
        <h1>${greetingLine(this.hass, this.config, this.now)}</h1>
        ${subtitle.length ? html`<p>${subtitle.join(" · ")}</p>` : nothing}
      </div>
      ${this.config.schedules_path
        ? html`<button class="schedules" aria-label="Schedules" title="Schedules" @click=${this.openSchedules}>
            <ha-icon icon="mdi:clock-outline"></ha-icon>
          </button>`
        : nothing}
    </header>`;
  }

  static styles = [
    tokens,
    css`
      header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 4px 4px;
        color: var(--moments-fg);
      }
      .text {
        min-width: 0;
      }
      .time {
        font-size: 15px;
        font-weight: 600;
        color: var(--moments-muted);
        font-variant-numeric: tabular-nums;
      }
      h1 {
        margin: 2px 0 0;
        font-size: clamp(30px, 8vw, 40px);
        line-height: 1.1;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      p {
        margin: 6px 0 0;
        font-size: 15px;
        line-height: 1.35;
        color: var(--moments-muted);
      }
      .schedules {
        flex: none;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        margin: -4px -4px 0 0;
        border-radius: 50%;
        background: transparent;
        color: var(--moments-muted);
        opacity: 0.7;
        transition: opacity 0.15s ease, background-color 0.15s ease;
      }
      .schedules:hover,
      .schedules:focus-visible {
        opacity: 1;
      }
      .schedules:active {
        background: color-mix(in srgb, var(--moments-muted) 12%, transparent);
      }
      .schedules ha-icon {
        --mdc-icon-size: 20px;
      }
      @media (prefers-reduced-motion: reduce) {
        .schedules {
          transition: none;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "moments-header": MomentsHeader;
  }
}
