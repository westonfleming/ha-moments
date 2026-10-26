import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { callWithFeedback, domainOf, fireMoreInfo, haptic, nameOf } from "../helpers";
import { currentContext } from "../context/daylight";
import { intentGroups, isActive, orderByContext, serviceFor, validateIntents } from "../intents";
import type { HomeAssistant, LovelaceCardConfig } from "../types";
import type { Intent } from "../config";

export type { Intent };

interface IntentsConfig extends LovelaceCardConfig {
  intents: Intent[];
  time_of_day_entity?: string;
  illuminance_entity?: string;
  dark_below?: number;
  area?: string;
  rooms_by_user?: Record<string, string>;
  include_house?: boolean;
}

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 10;

/** "What do you want to do" buttons, scoped to a room or the house and ordered by context. */
@customElement("moments-intents")
export class MomentsIntents extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: IntentsConfig;
  @state() private tick = 0;

  private timer?: number;
  private press?: { x: number; y: number; timer: number; entity: string };
  private longPressed = false;

  static getStubConfig(hass?: HomeAssistant) {
    const ids = Object.keys(hass?.states ?? {});
    const pick = ids.filter((id) => domainOf(id) === "scene").slice(0, 4);
    const fallback = pick.length ? pick : ids.filter((id) => domainOf(id) === "script").slice(0, 4);
    return {
      type: "custom:moments-intents",
      intents: (fallback.length ? fallback : ["scene.relax"]).map((entity) => ({ entity })),
    };
  }

  setConfig(config: IntentsConfig) {
    validateIntents(config?.intents);
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
    this.timer = window.setInterval(() => this.tick++, 60_000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
    this.cancelPress();
  }

  private run(intent: Intent, area?: string) {
    const { domain, service, data } = serviceFor(intent, area);
    callWithFeedback(this, this.hass, domain, service, data);
  }

  private onPointerDown(e: PointerEvent, entity: string) {
    if (e.button !== 0) return;
    this.cancelPress();
    this.longPressed = false;
    const timer = window.setTimeout(() => {
      this.press = undefined;
      this.longPressed = true;
      haptic(this, "medium");
      fireMoreInfo(this, entity);
    }, LONG_PRESS_MS);
    this.press = { x: e.clientX, y: e.clientY, timer, entity };
    window.addEventListener("scroll", this.cancelPress, { capture: true, passive: true, once: true });
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.press) return;
    if (Math.hypot(e.clientX - this.press.x, e.clientY - this.press.y) > MOVE_TOLERANCE) this.cancelPress();
  }

  private cancelPress = () => {
    if (this.press) window.clearTimeout(this.press.timer);
    this.press = undefined;
    window.removeEventListener("scroll", this.cancelPress, { capture: true });
  };

  private onClick(e: Event, intent: Intent, area?: string) {
    this.cancelPress();
    if (this.longPressed) {
      this.longPressed = false;
      e.preventDefault();
      return;
    }
    this.run(intent, area);
  }

  private renderIntent(intent: Intent, shown: Intent[], area?: string) {
    const entity = this.hass!.states[intent.entity];
    const name = intent.name ?? (entity ? nameOf(entity) : intent.entity);
    const active = isActive(this.hass, intent, shown);
    return html`<button
      class="intent ${active ? "on" : ""}"
      aria-pressed=${active ? "true" : "false"}
      title=${name}
      @pointerdown=${(e: PointerEvent) => this.onPointerDown(e, intent.entity)}
      @pointermove=${this.onPointerMove}
      @pointerup=${() => this.press && window.clearTimeout(this.press.timer)}
      @pointercancel=${this.cancelPress}
      @pointerleave=${this.cancelPress}
      @contextmenu=${(e: Event) => e.preventDefault()}
      @click=${(e: Event) => this.onClick(e, intent, area)}
    >
      <ha-icon .icon=${intent.icon ?? entity?.attributes.icon ?? "mdi:palette"}></ha-icon>
      <span class="text">
        <span class="name">${name}</span>
        ${intent.label ? html`<span class="label">${intent.label}</span>` : nothing}
      </span>
    </button>`;
  }

  render() {
    if (!this.hass || !this.config) return nothing;
    void this.tick;
    const c = this.config;
    const userArea = this.hass.user ? c.rooms_by_user?.[this.hass.user.id] : undefined;
    const tags = currentContext(this.hass, c);
    const groups = intentGroups(c.intents, { area: c.area, userArea, includeHouse: c.include_house }).map((g) => ({
      ...g,
      intents: orderByContext(g.intents, tags),
    }));
    if (!groups.length) return nothing;
    const shown = groups.flatMap((g) => g.intents);
    const titled = groups.length > 1;
    return html`${groups.map(
      (g) => html`<section>
        ${titled
          ? html`<div class="heading">${g.area ? this.hass!.areas?.[g.area]?.name ?? g.area : "Home"}</div>`
          : nothing}
        <div class="intents">${g.intents.map((i) => this.renderIntent(i, shown, g.area))}</div>
      </section>`,
    )}`;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }
      section + section {
        margin-top: 12px;
      }
      .heading {
        margin: 0 4px 6px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--moments-muted);
      }
      .intents {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--moments-gap);
      }
      .intent {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: space-between;
        gap: 6px;
        padding: 10px;
        min-width: 0;
        min-height: 72px;
        border-radius: var(--moments-radius);
        background: var(--moments-tile);
        color: var(--moments-fg);
        font-size: 0.8125rem;
        font-weight: 600;
        text-align: left;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        touch-action: manipulation;
        transition: transform 0.12s ease, background-color 0.2s ease;
      }
      .intent:active {
        transform: scale(0.97);
      }
      .intent.on {
        background: var(--moments-on);
        color: color-mix(in srgb, var(--moments-on) 22%, black);
      }
      .text {
        display: flex;
        flex-direction: column;
        min-width: 0;
        width: 100%;
      }
      .name,
      .label {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow-wrap: anywhere;
      }
      .label {
        -webkit-line-clamp: 1;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--moments-muted);
      }
      .intent.on .label {
        color: inherit;
        opacity: 0.8;
      }
      ha-icon {
        --mdc-icon-size: 20px;
      }
      @container (min-width: 520px) {
        .intents {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        }
        .intent {
          gap: 10px;
          padding: 14px;
          min-height: 88px;
          font-size: 0.9375rem;
        }
        ha-icon {
          --mdc-icon-size: 22px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .intent {
          transition: none;
        }
        .intent:active {
          transform: none;
        }
      }
    `,
  ];
}
