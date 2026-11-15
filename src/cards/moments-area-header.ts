import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { tokens } from "../styles/tokens";
import { resolveSurface, surfaceStyles, validateSurface, type SurfaceConfig } from "../styles/surface";
import { callWithFeedback, fireMoreInfo, isEntityId, nameOf } from "../helpers";
import { DEFAULT_LEVELS, GLYPH, kindOf, levelFor, discoverArea, presenceText, type MetricKind } from "../metrics";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

type Stat = "temperature" | "humidity" | "air" | "illuminance";
const STATS: Stat[] = ["temperature", "humidity", "air", "illuminance"];

interface AreaHeaderConfig extends LovelaceCardConfig, SurfaceConfig {
  /** Area id. Readings, presence, lights and alerts are found in it unless set below. */
  area: string;
  name?: string;
  /** Override or hide (false) any of the found entities. */
  temperature?: string | false;
  humidity?: string | false;
  air?: string | false;
  illuminance?: string | false;
  presence?: string | false;
  /** Lights for the count and the all-lights switch; false hides the switch. */
  lights?: string[] | false;
  /** Binary sensors that raise a red chip when on; false turns found ones off. */
  alerts?: string[] | false;
  /** Readings shown, in order. Default: temperature, humidity, air, illuminance. */
  show?: Stat[];
}

export interface HeaderModel {
  name: string;
  presence?: { on: boolean; text: string; entity: string };
  stats: { stat: Stat; kind: MetricKind; text: string; entity: string; alert?: string }[];
  lights: string[];
  lightsOn: number;
  alerts: { entity: string; text: string }[];
}

const pick = (configured: string | false | undefined, found: string | undefined) => (configured === false ? undefined : configured ?? found);
const BAD = new Set(["unknown", "unavailable"]);

/** Everything the header shows, worked out from the area and config. */
export const headerModel = (hass: HomeAssistant, c: AreaHeaderConfig, now = Date.now()): HeaderModel => {
  const found = discoverArea(hass, c.area);
  const name = c.name ?? hass.areas[c.area]?.name ?? c.area;
  const presId = pick(c.presence, found.presence);
  const pres = presId ? presenceText(hass.states[presId], now) : undefined;
  const stats: HeaderModel["stats"] = [];
  const alerts: HeaderModel["alerts"] = [];
  for (const stat of c.show ?? STATS) {
    const id = pick(c[stat], found[stat]);
    const e = id ? hass.states[id] : undefined;
    if (!id || !e || BAD.has(e.state)) continue;
    const kind = kindOf(e);
    const v = parseFloat(e.state);
    let text: string;
    if (stat === "temperature") text = `${Number.isFinite(v) ? v.toFixed(1) : e.state}°`;
    else if (stat === "humidity") text = `${Number.isFinite(v) ? Math.round(v) : e.state}%`;
    else if (stat === "illuminance") text = `${Number.isFinite(v) ? Math.round(v) : e.state} lx`;
    else {
      const level = levelFor(v, DEFAULT_LEVELS[kind]);
      text = level ? `Air ${level.label.toLowerCase()}` : `${e.state} ${e.attributes.unit_of_measurement ?? ""}`.trim();
      if (level?.color === "poor") alerts.push({ entity: id, text: `${kind === "co2" ? "CO₂" : "Air"} high` });
    }
    stats.push({ stat, kind, text, entity: id });
  }
  const lights = c.lights === false ? [] : c.lights ?? found.lights;
  const alertIds = c.alerts === false ? [] : c.alerts ?? found.alerts;
  for (const id of alertIds) {
    const e = hass.states[id];
    if (e?.state === "on") alerts.push({ entity: id, text: nameOf(e) });
  }
  return {
    name,
    presence: pres && presId ? { ...pres, entity: presId } : undefined,
    stats,
    lights,
    lightsOn: lights.filter((id) => hass.states[id]?.state === "on").length,
    alerts,
  };
};

/** The banner at the top of an area view: who's there, the room's readings, alerts and an all-lights switch. */
@customElement("moments-area-header")
export class MomentsAreaHeader extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: AreaHeaderConfig;

  static getStubConfig(hass: HomeAssistant) {
    return { area: Object.keys(hass?.areas ?? {})[0] ?? "living_room" };
  }

  setConfig(config: AreaHeaderConfig) {
    if (!config || typeof config.area !== "string" || !config.area) throw new Error("moments-area-header: area must be an area id");
    for (const key of ["temperature", "humidity", "air", "illuminance", "presence"] as const) {
      const v = config[key];
      if (v !== undefined && v !== false && !isEntityId(v)) throw new Error(`moments-area-header: ${key} must be an entity id or false`);
    }
    for (const key of ["lights", "alerts"] as const) {
      const v = config[key];
      if (v !== undefined && v !== false && !(Array.isArray(v) && v.every(isEntityId)))
        throw new Error(`moments-area-header: ${key} must be a list of entity ids or false`);
    }
    if (config.show !== undefined && !(Array.isArray(config.show) && config.show.every((s) => STATS.includes(s))))
      throw new Error(`moments-area-header: show must list some of ${STATS.join(", ")}`);
    validateSurface("moments-area-header", config);
    this.config = config;
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }

  private toggleLights(m: HeaderModel) {
    if (!m.lights.length) return;
    callWithFeedback(this, this.hass, "light", m.lightsOn ? "turn_off" : "turn_on", { entity_id: m.lights });
  }

  protected render() {
    if (!this.config || !this.hass) return nothing;
    const m = headerModel(this.hass, this.config);
    const { surface, style } = resolveSurface(this, this.config);
    const dark = this.hass.themes?.darkMode ? " dark" : "";
    const tint = (k: MetricKind) => (k === "temperature" || k === "co2" || k === "pm25" || k === "voc" ? "var(--moments-ok)" : k === "humidity" ? "var(--moments-blue)" : "var(--moments-sun)");
    return html`
      <ha-card class="${surface}${dark}" style="${style}">
        <div class="top">
          <div class="title">
            <h2>${m.name}</h2>
            ${m.presence
              ? html`<button class="presence ${m.presence.on ? "on" : ""}" @click=${() => fireMoreInfo(this, m.presence!.entity)}>
                  <i></i>${m.presence.text}
                </button>`
              : nothing}
          </div>
          ${m.lights.length
            ? html`<button
                class="lights ${m.lightsOn ? "on" : ""}"
                role="switch"
                aria-checked="${m.lightsOn > 0}"
                aria-label="${m.lightsOn ? "Turn off" : "Turn on"} all lights in ${m.name}"
                @click=${() => this.toggleLights(m)}
              >
                <span>${m.lightsOn} of ${m.lights.length} light${m.lights.length === 1 ? "" : "s"}</span><span class="sw"></span>
              </button>`
            : nothing}
        </div>
        ${m.stats.length || m.alerts.length
          ? html`<div class="stats">
              ${m.alerts.map((a) => html`<button class="chip alert" @click=${() => fireMoreInfo(this, a.entity)}>${unsafeSVG(GLYPH.alert)}${a.text}</button>`)}
              ${m.stats.map(
                (s) => html`<button class="chip" style="--c:${tint(s.kind)}" @click=${() => fireMoreInfo(this, s.entity)}>${unsafeSVG(GLYPH[s.kind])}${s.text}</button>`,
              )}
            </div>`
          : nothing}
      </ha-card>
    `;
  }

  static styles = [
    tokens,
    surfaceStyles,
    css`
      ha-card {
        padding: 14px 16px;
        display: grid;
        gap: 10px;
        color: var(--moments-fg);
        border-radius: var(--moments-radius);
      }
      .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.15;
      }
      .presence {
        background: none;
        padding: 0;
        margin-top: 3px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        color: var(--moments-muted);
      }
      .presence i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.5;
      }
      .presence.on {
        color: var(--moments-purple);
      }
      .presence.on i {
        opacity: 1;
        box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 25%, transparent);
      }
      .lights {
        background: none;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        font-weight: 600;
        color: var(--moments-muted);
        padding: 4px 0;
      }
      .sw {
        width: 44px;
        height: 26px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--moments-muted) 35%, transparent);
        position: relative;
        transition: background 0.2s;
      }
      .sw::after {
        content: "";
        position: absolute;
        left: 3px;
        top: 3px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
        transition: transform 0.2s;
      }
      .lights.on .sw {
        background: var(--moments-on);
      }
      .lights.on .sw::after {
        transform: translateX(18px);
      }
      .stats {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        padding: 5px 11px 5px 8px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--c, var(--moments-muted)) 13%, transparent);
        font-variant-numeric: tabular-nums;
      }
      .chip svg {
        width: 16px;
        height: 16px;
      }
      .chip.alert {
        background: var(--moments-alert);
        color: #fff;
      }
    `,
  ];
}
