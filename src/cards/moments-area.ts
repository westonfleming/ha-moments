import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { tokens } from "../styles/tokens";
import { resolveSurface, surfaceStyles, validateSurface } from "../styles/surface";
import { navigate } from "../helpers";
import { GLYPH } from "../metrics";
import { headerModel, validateAreaOptions, type AreaHeaderConfig } from "./moments-area-header";
import type { HomeAssistant } from "../types";

export type ImageStyle = "wash" | "edge" | "full" | "none";
const IMAGE_STYLES: ImageStyle[] = ["wash", "edge", "full", "none"];

export interface AreaCardConfig extends AreaHeaderConfig {
  /** Picture URL. Default: the area's own picture. false hides it. */
  image?: string | false;
  /** How the photo sits behind the content. Default wash. */
  image_style?: ImageStyle;
  /** 0–1: how strongly the photo shows through in wash and edge. Default 0.3. */
  image_strength?: number;
  /** Greyscale the photo while nobody is there. Default true. */
  dim_when_empty?: boolean;
  /** View to open on tap. Default: a view whose path is the area id. false: no tap. */
  navigation_path?: string | false;
}

/** The photo URL for an area, or undefined when there is none or it's turned off. */
export const areaImage = (hass: HomeAssistant, c: AreaCardConfig): string | undefined => {
  if (c.image === false || c.image_style === "none") return undefined;
  return c.image ?? hass.areas[c.area]?.picture ?? undefined;
};

const cssUrl = (u: string) => `url("${u.replace(/["\\\n]/g, (ch) => encodeURIComponent(ch))}")`;

/** An area on the home view: name, presence, temperature, lights on and alerts, over an optional faded photo. Taps open the area's view. */
@customElement("moments-area")
export class MomentsArea extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: AreaCardConfig;

  static getStubConfig(hass: HomeAssistant) {
    return { area: Object.keys(hass?.areas ?? {})[0] ?? "living_room" };
  }

  setConfig(config: AreaCardConfig) {
    validateAreaOptions("moments-area", config);
    if (config.image !== undefined && config.image !== false && typeof config.image !== "string")
      throw new Error("moments-area: image must be a URL or false");
    if (config.image_style !== undefined && !IMAGE_STYLES.includes(config.image_style))
      throw new Error(`moments-area: image_style must be one of ${IMAGE_STYLES.join(", ")}`);
    const s = config.image_strength;
    if (s !== undefined && (typeof s !== "number" || s < 0 || s > 1)) throw new Error("moments-area: image_strength must be between 0 and 1");
    if (config.navigation_path !== undefined && config.navigation_path !== false && typeof config.navigation_path !== "string")
      throw new Error("moments-area: navigation_path must be a path or false");
    validateSurface("moments-area", config);
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: 6, min_columns: 4, rows: 2, min_rows: 2 };
  }

  private get path() {
    const p = this.config.navigation_path;
    return p === false ? undefined : p ?? this.config.area;
  }

  private open = () => {
    if (this.path) navigate(this.path);
  };

  protected render() {
    if (!this.config || !this.hass) return nothing;
    const c = this.config;
    const m = headerModel(this.hass, { ...c, show: ["temperature"] });
    const temp = m.stats[0];
    const img = areaImage(this.hass, c);
    const style = img ? c.image_style ?? "wash" : "none";
    const empty = m.presence ? !m.presence.on : false;
    const dim = empty && c.dim_when_empty !== false;
    const { surface, style: surfaceStyle } = resolveSurface(this, c);
    const dark = this.hass.themes?.darkMode ? " dark" : "";
    const strength = style === "full" ? 1 : c.image_strength ?? 0.3;
    const lights = m.lights.length
      ? html`<span class="chip ${m.lightsOn ? "lit" : ""}">${unsafeSVG(GLYPH.bulb)}${m.lightsOn ? `${m.lightsOn} of ${m.lights.length} on` : "Lights off"}</span>`
      : nothing;
    const alert = m.alerts.length
      ? html`<span class="chip alert">${m.alerts[0].text}${m.alerts.length > 1 ? ` +${m.alerts.length - 1}` : ""}</span>`
      : nothing;
    return html`
      <ha-card
        class="${surface}${dark} ${style}${dim ? " empty" : ""}"
        style="${surfaceStyle}"
        role=${this.path ? "link" : nothing}
        tabindex=${this.path ? "0" : nothing}
        aria-label="${m.name}${m.presence ? `, ${m.presence.text}` : ""}${temp ? `, ${temp.text}` : ""}"
        @click=${this.open}
        @keydown=${(ev: KeyboardEvent) => ev.key === "Enter" && this.open()}
      >
        ${img ? html`<div class="img" style="background-image:${cssUrl(img)};opacity:${strength}"></div>` : nothing}
        <div class="in">
          <div class="top">
            <div class="who">
              <h3>${m.name}</h3>
              ${m.presence ? html`<span class="presence ${m.presence.on ? "on" : ""}"><i></i>${m.presence.text}</span>` : nothing}
            </div>
            ${temp ? html`<div class="temp">${temp.text}</div>` : nothing}
          </div>
          <div class="row">${alert}${lights}</div>
        </div>
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
        min-height: 112px;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
        color: var(--moments-fg);
        border-radius: var(--moments-radius);
      }
      ha-card[role="link"] {
        cursor: pointer;
      }
      ha-card:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      .img {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        filter: saturate(0.55) blur(1.2px);
        transform: scale(1.03);
        pointer-events: none;
      }
      .edge .img {
        left: 35%;
        -webkit-mask-image: linear-gradient(to right, transparent, #000 55%);
        mask-image: linear-gradient(to right, transparent, #000 55%);
      }
      .full .img {
        filter: saturate(0.85);
        transform: none;
      }
      .full .img::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgb(0 0 0 / 0.75), rgb(0 0 0 / 0.4) 55%, rgb(0 0 0 / 0.25));
      }
      .empty .img {
        filter: grayscale(1) blur(1.2px);
      }
      .full.empty .img {
        filter: grayscale(0.85) brightness(0.92);
      }
      .in {
        position: relative;
        height: 100%;
        box-sizing: border-box;
        padding: 12px 14px;
        display: grid;
        gap: 10px;
        align-content: space-between;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
      }
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .presence {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-top: 2px;
        font-size: 12px;
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
      }
      .temp {
        font-size: 22px;
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
      }
      .wash .temp,
      .edge .temp {
        text-shadow: 0 0 12px var(--moments-tile, var(--card-background-color));
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
        font-weight: 600;
        padding: 3px 9px 3px 6px;
        border-radius: 999px;
        color: var(--moments-muted);
        background: color-mix(in srgb, var(--moments-muted) 14%, transparent);
      }
      .chip.lit {
        color: inherit;
        background: color-mix(in srgb, var(--moments-sun) 18%, transparent);
      }
      .chip:not(.lit) svg {
        filter: grayscale(1);
        opacity: 0.7;
      }
      .chip svg {
        width: 14px;
        height: 14px;
      }
      .chip.alert {
        padding-left: 9px;
        background: var(--moments-alert);
        color: #fff;
      }
      /* Full photo: light text over the scrim, content at the bottom. */
      .full .in {
        color: #fff;
        text-shadow: 0 1px 8px rgb(0 0 0 / 0.45);
        align-content: end;
      }
      .full .top {
        order: 0;
      }
      .full .presence,
      .full .presence.on {
        color: rgb(255 255 255 / 0.85);
      }
      .full .chip:not(.alert) {
        color: #fff;
        background: rgb(255 255 255 / 0.18);
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
      }
    `,
  ];
}
