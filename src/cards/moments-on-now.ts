import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { callWithFeedback, domainOf, fireMoreInfo } from "../helpers";
import { groupOnNow, onNowFor, type OnNowItem } from "../exceptions";
import type { RoomGroup } from "../config";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

interface OnNowConfig extends LovelaceCardConfig {
  domains?: string[];
  exclude?: string[];
  groups?: RoomGroup[];
}

const GROUP_ABOVE = 6;
const FADE_MS = 250;
const RESTORE_MS = 5000;

interface Pending {
  state: string;
  since: number;
}

const isStringList = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === "string");

/** Everything that is on or open right now. Shrinks to nothing as the house goes quiet. */
@customElement("moments-on-now")
export class MomentsOnNow extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: OnNowConfig;
  @state() private pending = new Map<string, Pending>();
  private timers = new Set<ReturnType<typeof setTimeout>>();

  static getStubConfig() {
    return {};
  }

  setConfig(config: OnNowConfig) {
    if (!config) throw new Error("moments-on-now: missing configuration");
    if (config.domains !== undefined && !isStringList(config.domains))
      throw new Error("moments-on-now: domains must be a list of domains, e.g. [light, fan]");
    if (config.exclude !== undefined && !isStringList(config.exclude))
      throw new Error("moments-on-now: exclude must be a list of entity ids");
    if (config.groups !== undefined) {
      if (!Array.isArray(config.groups)) throw new Error("moments-on-now: groups must be a list");
      for (const g of config.groups)
        if (typeof g?.name !== "string" || !isStringList(g?.areas))
          throw new Error("moments-on-now: each group needs a name and a list of areas");
    }
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.pending = new Map();
  }

  private later(ms: number) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      this.requestUpdate();
    }, ms);
    this.timers.add(t);
  }

  /** Drops pending rows whose state has changed or whose wait has run out. */
  private prune() {
    const now = Date.now();
    let changed = false;
    for (const [id, p] of this.pending) {
      if (now - p.since >= RESTORE_MS || this.hass?.states[id]?.state !== p.state) {
        this.pending.delete(id);
        changed = true;
      }
    }
    if (changed) this.pending = new Map(this.pending);
  }

  private hide(items: OnNowItem[]) {
    const since = Date.now();
    const next = new Map(this.pending);
    for (const i of items) next.set(i.entityId, { state: i.entity.state, since });
    this.pending = next;
    this.later(FADE_MS);
    this.later(RESTORE_MS);
  }

  private turnOff(item: OnNowItem) {
    this.hide([item]);
    if (domainOf(item.entityId) === "cover")
      callWithFeedback(this, this.hass, "cover", "close_cover", { entity_id: item.entityId });
    else callWithFeedback(this, this.hass, "homeassistant", "turn_off", { entity_id: item.entityId });
  }

  private allOff(items: OnNowItem[]) {
    const lights = items.filter((i) => domainOf(i.entityId) === "light");
    if (!lights.length) return;
    this.hide(lights);
    callWithFeedback(this, this.hass, "light", "turn_off", { entity_id: lights.map((i) => i.entityId) });
  }

  protected willUpdate() {
    this.prune();
  }

  private row(item: OnNowItem, showLabel: boolean) {
    const leaving = this.pending.has(item.entityId);
    return html`<div class="row ${leaving ? "leaving" : ""}">
      <button class="name" @click=${() => fireMoreInfo(this, item.entityId)}>
        <span class="dot"></span>
        <span class="text">
          <span class="title">${item.name}</span>
          ${showLabel && item.label ? html`<span class="area">· ${item.label}</span>` : nothing}
        </span>
      </button>
      <button class="tog" aria-label="Turn off ${item.name}" ?disabled=${leaving} @click=${() => this.turnOff(item)}>
        <span class="pill"></span>
      </button>
    </div>`;
  }

  render() {
    if (!this.hass || !this.config) return nothing;
    const now = Date.now();
    const all = onNowFor(this.hass, this.config);
    const items = all.filter((i) => {
      const p = this.pending.get(i.entityId);
      return !p || now - p.since < FADE_MS;
    });
    if (!items.length) return html`<div class="quiet">All quiet</div>`;
    const hasLights = items.some((i) => domainOf(i.entityId) === "light" && !this.pending.has(i.entityId));
    const grouped = items.length > GROUP_ABOVE;
    return html`<div class="list">
      ${grouped
        ? groupOnNow(items).map(
            (g) => html`<div class="heading">${g.label ?? "Other"}</div>
              ${g.items.map((i) => this.row(i, false))}`,
          )
        : items.map((i) => this.row(i, true))}
      ${hasLights ? html`<button class="all" @click=${() => this.allOff(items)}>All lights off</button>` : nothing}
    </div>`;
  }

  static styles = [
    tokens,
    css`
      .list,
      .quiet {
        background: var(--moments-tile);
        border-radius: var(--moments-radius);
        padding: 4px 14px;
      }
      .quiet {
        padding: 14px;
        color: var(--moments-muted);
      }
      .heading {
        padding: 14px 0 4px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--moments-muted);
      }
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid var(--divider-color);
        transition: opacity ${FADE_MS}ms ease;
      }
      .row.leaving {
        opacity: 0;
        pointer-events: none;
      }
      .name {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 44px;
        padding: 6px 0;
        background: none;
        text-align: left;
        min-width: 0;
      }
      .text {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
      }
      .title,
      .area {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .title {
        flex: 0 1 auto;
      }
      .area {
        flex: 0 2 auto;
        font-size: 13px;
        color: var(--moments-muted);
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--moments-on);
        flex: none;
      }
      .tog {
        width: 44px;
        height: 44px;
        margin-right: -2px;
        display: grid;
        place-items: center;
        background: none;
        flex: none;
      }
      .pill {
        width: 40px;
        height: 24px;
        border-radius: 12px;
        background: var(--moments-on);
        position: relative;
        transition: background-color 150ms ease;
      }
      .pill::after {
        content: "";
        position: absolute;
        right: 3px;
        top: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--text-primary-color, #fff);
        transition: right 150ms ease;
      }
      .leaving .pill {
        background: var(--divider-color);
      }
      .leaving .pill::after {
        right: 19px;
      }
      .all {
        width: 100%;
        min-height: 44px;
        padding: 0;
        background: none;
        color: var(--moments-muted);
        text-align: left;
      }
      @media (prefers-reduced-motion: reduce) {
        .row,
        .pill,
        .pill::after {
          transition: none;
        }
      }
    `,
  ];
}
