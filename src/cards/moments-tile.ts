import { LitElement, html, css, nothing, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { resolveSurface, surfaceStyles, validateSurface, type SurfaceConfig } from "../styles/surface";
import { callWithFeedback, domainOf, fireMoreInfo, isEntityId, nameOf } from "../helpers";
import { formatTime } from "../format";
import { ICONS, ICON_CSS, ICON_SETS } from "../icons/generated";
import { inferIconSet, isBlindStep, resolveIconState, tintFor, type ResolveOptions } from "../icons/resolve";
import type { HassEntity, HomeAssistant, LovelaceCardConfig } from "../types";

export interface TileConfig extends LovelaceCardConfig, SurfaceConfig, ResolveOptions {
  entity: string;
  name?: string;
  /** Which Moments icon to draw, e.g. dishwasher. Default: picked from the entity's domain and device class. */
  icon_set?: string;
  /** glow | crisp. Default: the theme's moments-icon-style, else glow. */
  icon_style?: "glow" | "crisp";
  /** An entity whose state follows the main state (e.g. the programme), or plain text. */
  secondary?: string;
  /** Entities whose values join the state line, e.g. power and energy. */
  metrics?: string[];
  /** Progress entity (0–100), or "position" for a cover's position. Only drawn when given. */
  progress?: string;
  /** Timestamp entity shown beside the progress bar as the finish time. */
  finish?: string;
  /** more-info (default), toggle or none. */
  tap_action?: "more-info" | "toggle" | "none";
}

const BAD = new Set(["unknown", "unavailable", ""]);
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : s);

/** Formats an entity's state the way HA does when it can, else state plus unit. */
export const formatState = (hass: HomeAssistant, e: HassEntity) => {
  if (hass.formatEntityState) return hass.formatEntityState(e);
  const unit = e.attributes.unit_of_measurement;
  return unit ? `${e.state} ${unit}` : cap(e.state);
};

/** The parts of the state line: main state (with brightness, position or temperature), secondary, metrics. */
export const stateLine = (hass: HomeAssistant, c: TileConfig, e: HassEntity | undefined): string[] => {
  if (!e) return ["Unavailable"];
  const parts: string[] = [];
  let main = formatState(hass, e);
  const domain = domainOf(e.entity_id);
  const a = e.attributes;
  if (domain === "light" && e.state === "on" && typeof a.brightness === "number") main += ` · ${Math.round((a.brightness / 255) * 100)}%`;
  if (domain === "cover" && typeof a.current_position === "number" && a.current_position > 0 && a.current_position < 100 && c.progress !== "position")
    main += ` · ${a.current_position}%`;
  if (domain === "climate" && typeof a.current_temperature === "number") main += ` · ${a.current_temperature}°`;
  parts.push(main);
  if (c.secondary) {
    if (isEntityId(c.secondary)) {
      const s = hass.states[c.secondary];
      if (s && !BAD.has(s.state)) parts.push(formatState(hass, s));
    } else parts.push(c.secondary);
  }
  for (const id of c.metrics ?? []) {
    const m = hass.states[id];
    if (m && !BAD.has(m.state)) parts.push(formatState(hass, m));
  }
  return parts;
};

/** Progress as 0–1 and an optional finish time, or undefined when there's nothing to draw. */
export const progressOf = (hass: HomeAssistant, c: TileConfig, e: HassEntity | undefined, locale?: HomeAssistant["locale"]) => {
  if (!c.progress || !e) return undefined;
  let pct: number | undefined;
  if (c.progress === "position") pct = typeof e.attributes.current_position === "number" ? e.attributes.current_position : undefined;
  else {
    const v = parseFloat(hass.states[c.progress]?.state ?? "");
    if (Number.isFinite(v) && v > 0 && v < 100) pct = v;
  }
  if (pct === undefined) return undefined;
  let finish: string | undefined;
  const f = c.finish ? hass.states[c.finish]?.state : undefined;
  if (f && !BAD.has(f)) {
    const d = new Date(f);
    if (!isNaN(d.getTime())) finish = formatTime(d, locale as any);
  }
  return { value: Math.min(1, Math.max(0, pct / 100)), finish };
};

/** Glides a blind icon's shade to a position step without redrawing the icon. */
const setBlind = (root: Element, step: number) => {
  const k = 0.12 + 0.88 * (1 - step / 100);
  const shade = root.querySelector<SVGGElement>(".hm-shade");
  const bar = root.querySelector<SVGGElement>(".hm-bar");
  if (!shade || !bar) return false;
  shade.style.transform = `translateY(14px) scaleY(${k.toFixed(3)}) translateY(-14px)`;
  bar.style.transform = `translateY(${(-37 * (1 - k)).toFixed(2)}px)`;
  return true;
};

/** One device: a Moments icon that follows its state, its name, and a state line with optional extras. */
@customElement("moments-tile")
export class MomentsTile extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: TileConfig;
  private shownIcon?: string;

  static getStubConfig(hass: HomeAssistant) {
    const entity = Object.keys(hass?.states ?? {}).find((id) => id.startsWith("light.")) ?? "light.kitchen";
    return { entity };
  }

  setConfig(config: TileConfig) {
    if (!config || !isEntityId(config.entity)) throw new Error("moments-tile: entity must be an entity id");
    if (config.icon_set !== undefined && !ICON_SETS[config.icon_set])
      throw new Error(`moments-tile: icon_set must be one of ${Object.keys(ICON_SETS).join(", ")}`);
    if (config.icon_style !== undefined && !["glow", "crisp"].includes(config.icon_style))
      throw new Error("moments-tile: icon_style must be glow or crisp");
    if (config.metrics !== undefined && (!Array.isArray(config.metrics) || !config.metrics.every(isEntityId)))
      throw new Error("moments-tile: metrics must be a list of entity ids");
    if (config.progress !== undefined && config.progress !== "position" && !isEntityId(config.progress))
      throw new Error('moments-tile: progress must be an entity id or "position"');
    if (config.finish !== undefined && !isEntityId(config.finish)) throw new Error("moments-tile: finish must be an entity id");
    if (config.states !== undefined) {
      const ok = typeof config.states === "object" && Object.values(config.states).every((v) => Array.isArray(v) && v.every((x) => typeof x === "string"));
      if (!ok) throw new Error("moments-tile: states must map icon states to lists of states");
    }
    if (config.tap_action !== undefined && !["more-info", "toggle", "none"].includes(config.tap_action))
      throw new Error("moments-tile: tap_action must be more-info, toggle or none");
    validateSurface("moments-tile", config);
    this.config = config;
    this.shownIcon = undefined;
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return { columns: 6, min_columns: 3, rows: "auto" };
  }

  private get entity() {
    return this.hass?.states[this.config.entity];
  }

  private iconFor(e: HassEntity | undefined) {
    const set = this.config.icon_set ?? (e ? inferIconSet(e) : undefined);
    if (!set) return undefined;
    const st = resolveIconState(set, e, this.config);
    const themeStyle = getComputedStyle(this).getPropertyValue("--moments-icon-style").trim().replace(/["']/g, "");
    const style = this.config.icon_style ?? (themeStyle === "crisp" ? "crisp" : "glow");
    return { set, state: st, style, key: `${style}:${set}/${st}` };
  }

  private onTap() {
    const c = this.config;
    if (c.tap_action === "none") return;
    if (c.tap_action === "toggle") callWithFeedback(this, this.hass, "homeassistant", "toggle", { entity_id: c.entity });
    else fireMoreInfo(this, c.entity);
  }

  protected render() {
    if (!this.config || !this.hass) return nothing;
    const e = this.entity;
    const icon = this.iconFor(e);
    const tint = icon ? tintFor(icon.set, icon.state) : undefined;
    const { surface, style } = resolveSurface(this, this.config);
    const dark = this.hass.themes?.darkMode ? " dark" : "";
    const parts = stateLine(this.hass, this.config, e);
    const prog = progressOf(this.hass, this.config, e, this.hass.locale);
    const name = this.config.name ?? (e ? nameOf(e) : this.config.entity);
    return html`
      <ha-card
        class="${surface}${dark}${tint ? " active" : ""}"
        style="${style};${tint ? `--tint:${tint}` : ""}"
        role="button"
        tabindex="0"
        aria-label="${name}, ${parts.join(", ")}"
        @click=${this.onTap}
        @keydown=${(ev: KeyboardEvent) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), this.onTap())}
      >
        <div class="badge">${icon ? html`<div class="icon" id="icon"></div>` : html`<ha-state-icon .hass=${this.hass} .stateObj=${e}></ha-state-icon>`}</div>
        <div class="text">
          <div class="name">${name}</div>
          <div class="state">${parts.join(" · ")}</div>
          ${prog
            ? html`<div class="progress" aria-label="${Math.round(prog.value * 100)}%">
                <span class="track"><span class="fill" style="width:${prog.value * 100}%"></span></span>
                <span class="pct">${Math.round(prog.value * 100)}%${prog.finish ? ` · ${prog.finish}` : ""}</span>
              </div>`
            : nothing}
        </div>
      </ha-card>
    `;
  }

  protected updated() {
    const host = this.renderRoot.querySelector("#icon");
    if (!host) {
      this.shownIcon = undefined;
      return;
    }
    const icon = this.iconFor(this.entity);
    if (!icon || icon.key === this.shownIcon) return;
    const prev = this.shownIcon;
    // Blind steps: keep the drawn icon and let its shade glide to the new position.
    if (prev && host.firstElementChild && prev.startsWith(`${icon.style}:blind/`) && icon.set === "blind") {
      const before = prev.split("/")[1];
      if (isBlindStep(before) && isBlindStep(icon.state) && setBlind(host, Number(icon.state))) {
        this.shownIcon = icon.key;
        return;
      }
    }
    host.innerHTML = ICONS[icon.style as "glow" | "crisp"][`${icon.set}/${icon.state}`] ?? "";
    this.shownIcon = icon.key;
  }

  static styles = [
    tokens,
    surfaceStyles,
    unsafeCSS(ICON_CSS),
    css`
      :host {
        display: block;
      }
      ha-card {
        height: 100%;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 10px;
        padding: 9px 12px 9px 9px;
        cursor: pointer;
        color: var(--moments-fg);
        border-radius: var(--moments-radius);
        -webkit-tap-highlight-color: transparent;
      }
      ha-card:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      .badge {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--tint, var(--moments-muted)) 16%, transparent);
        --mdc-icon-size: 24px;
        color: var(--tint, var(--moments-muted));
      }
      .icon,
      .icon svg {
        width: 32px;
        height: 32px;
        display: block;
      }
      .text {
        min-width: 0;
      }
      .name {
        font-size: 14px;
        font-weight: 600;
        line-height: 1.25;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .state {
        font-size: 12px;
        line-height: 1.3;
        margin-top: 2px;
        color: var(--moments-muted);
        font-variant-numeric: tabular-nums;
      }
      .active .state {
        color: var(--tint);
        font-weight: 600;
      }
      .progress {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 6px;
        margin-top: 5px;
      }
      .track {
        height: 4px;
        border-radius: 2px;
        overflow: hidden;
        background: color-mix(in srgb, var(--moments-muted) 28%, transparent);
      }
      .fill {
        display: block;
        height: 100%;
        border-radius: 2px;
        background: var(--tint, var(--moments-on));
      }
      .pct {
        font-size: 11px;
        font-weight: 600;
        color: var(--tint, var(--moments-muted));
        font-variant-numeric: tabular-nums;
      }
      .hm-shade,
      .hm-bar {
        transition: transform 1.1s cubic-bezier(0.45, 0.05, 0.3, 1);
      }
    `,
  ];
}
