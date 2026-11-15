import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { headerModel } from "./moments-area-header";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

interface FloorHeadingConfig extends LovelaceCardConfig {
  /** Floor id. Its areas are taken from Home Assistant's floors. */
  floor?: string;
  /** Or the areas to summarise, when there is no floor. */
  areas?: string[];
  name?: string;
  /** Show the summary line. Default true. */
  summary?: boolean;
}

/** Areas on a floor, in Home Assistant's order. */
export const areasOnFloor = (hass: HomeAssistant, floorId: string) =>
  Object.values(hass.areas)
    .filter((a) => a.floor_id === floorId)
    .map((a) => a.area_id);

/** "2 occupied · 5 lights on · 21.2° avg", from the areas' presence, lights and temperatures. */
export const floorSummary = (hass: HomeAssistant, areaIds: string[], now = Date.now()) => {
  let occupied = 0;
  let sensed = 0;
  let lightsOn = 0;
  let lightsAll = 0;
  const temps: number[] = [];
  for (const area of areaIds) {
    const m = headerModel(hass, { type: "x", area, show: ["temperature"] }, now);
    if (m.presence) {
      sensed++;
      if (m.presence.on) occupied++;
    }
    lightsOn += m.lightsOn;
    lightsAll += m.lights.length;
    const t = parseFloat(m.stats[0] ? hass.states[m.stats[0].entity].state : "");
    if (Number.isFinite(t)) temps.push(t);
  }
  const parts: string[] = [];
  if (sensed) parts.push(occupied ? `${occupied} occupied` : "Nobody");
  if (lightsAll) parts.push(lightsOn ? `${lightsOn} light${lightsOn === 1 ? "" : "s"} on` : "Lights off");
  if (temps.length) {
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    parts.push(`${avg.toFixed(1)}°${temps.length > 1 ? " avg" : ""}`);
  }
  return parts.join(" · ");
};

/** A floor's title and a one-line summary of its areas, for grouping area cards on a home view. */
@customElement("moments-floor-heading")
export class MomentsFloorHeading extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: FloorHeadingConfig;

  static getStubConfig(hass: HomeAssistant) {
    return { floor: Object.keys(hass?.floors ?? {})[0] ?? "downstairs" };
  }

  setConfig(config: FloorHeadingConfig) {
    const hasFloor = typeof config?.floor === "string" && config.floor.length > 0;
    const hasAreas = Array.isArray(config?.areas) && config.areas.every((a) => typeof a === "string");
    if (!hasFloor && !hasAreas) throw new Error("moments-floor-heading: set floor (a floor id) or areas (a list of area ids)");
    if (config.summary !== undefined && typeof config.summary !== "boolean") throw new Error("moments-floor-heading: summary must be true or false");
    this.config = config;
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return { columns: "full", rows: 1 };
  }

  protected render() {
    if (!this.config || !this.hass) return nothing;
    const c = this.config;
    const name = c.name ?? (c.floor ? this.hass.floors?.[c.floor]?.name ?? c.floor : "");
    const areas = c.areas ?? areasOnFloor(this.hass, c.floor!);
    const summary = c.summary === false ? "" : floorSummary(this.hass, areas);
    return html`<div class="fh"><h2>${name}</h2>${summary ? html`<span>${summary}</span>` : nothing}</div>`;
  }

  static styles = [
    tokens,
    css`
      .fh {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        column-gap: 10px;
        row-gap: 2px;
        padding: 8px 4px 0;
        color: var(--moments-fg);
      }
      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      span {
        font-size: 13px;
        font-weight: 600;
        color: var(--moments-muted);
      }
    `,
  ];
}
