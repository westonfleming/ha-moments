import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { callWithFeedback, domainOf, fireMoreInfo, haptic } from "../helpers";
import {
  activeMoment,
  areaLights,
  callsFor,
  defaultActive,
  defaultOf,
  returnToDefault,
  runList,
  validateAreaMoments,
  type AreaMomentsConfig,
} from "../moments";
import type { ServiceCall } from "../intents";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

type Config = AreaMomentsConfig & LovelaceCardConfig;

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 10;

/**
 * An area's moments as small chips, for under its lights: the default first, then
 * the moments that override it. One is active at a time; tapping the active moment
 * returns the area to its default.
 */
@customElement("moments-area-moments")
export class MomentsAreaMoments extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: Config;
  @state() private tick = 0;

  private timer?: number;
  private press?: { x: number; y: number; timer: number };
  private longPressed = false;

  static getStubConfig(hass?: HomeAssistant) {
    const scenes = Object.keys(hass?.states ?? {}).filter((id) => domainOf(id) === "scene");
    const [first, ...rest] = scenes.length ? scenes : ["scene.natural_light", "scene.movie"];
    return {
      type: "custom:moments-area-moments",
      default: { name: "Default", run: first },
      moments: (rest.length ? rest : ["scene.movie"]).slice(0, 3).map((run) => ({
        name: hass?.states[run]?.attributes.friendly_name ?? run.split(".")[1],
        run,
      })),
    };
  }

  setConfig(config: Config) {
    this.config = validateAreaMoments(config) as Config;
  }

  getCardSize() {
    return 1;
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

  private async call(calls: ServiceCall[]) {
    for (const { domain, service, data } of calls) await callWithFeedback(this, this.hass, domain, service, data);
  }

  private tapMoment(i: number, active: boolean) {
    const c = this.config;
    this.call(active ? returnToDefault(this.hass!, c) : callsFor(c.moments![i].run));
  }

  private tapDefault(active: boolean) {
    const c = this.config;
    const lights = areaLights(this.hass!, c);
    if (active) {
      if (lights.length) this.call([{ domain: "light", service: "turn_off", data: { entity_id: lights } }]);
      return;
    }
    const run = defaultOf(c).run;
    if (runList(run).length) this.call(callsFor(run));
    else if (lights.length) this.call([{ domain: "light", service: "turn_on", data: { entity_id: lights } }]);
  }

  private onPointerDown(e: PointerEvent, entity: string | undefined) {
    if (e.button !== 0) return;
    this.cancelPress();
    this.longPressed = false;
    if (!entity) return;
    const timer = window.setTimeout(() => {
      this.press = undefined;
      this.longPressed = true;
      haptic(this, "medium");
      fireMoreInfo(this, entity);
    }, LONG_PRESS_MS);
    this.press = { x: e.clientX, y: e.clientY, timer };
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

  private onClick(e: Event, tap: () => void) {
    this.cancelPress();
    if (this.longPressed) {
      this.longPressed = false;
      e.preventDefault();
      return;
    }
    tap();
  }

  private chip(name: string, icon: string, active: boolean, entity: string | undefined, tap: () => void) {
    return html`<button
      class="chip ${active ? "on" : ""}"
      aria-pressed=${active ? "true" : "false"}
      title=${active ? `${name}: tap to end` : name}
      @pointerdown=${(e: PointerEvent) => this.onPointerDown(e, entity)}
      @pointermove=${this.onPointerMove}
      @pointerup=${() => this.press && window.clearTimeout(this.press.timer)}
      @pointercancel=${this.cancelPress}
      @pointerleave=${this.cancelPress}
      @contextmenu=${(e: Event) => e.preventDefault()}
      @click=${(e: Event) => this.onClick(e, tap)}
    >
      <ha-icon .icon=${icon}></ha-icon><span>${name}</span>
    </button>`;
  }

  render() {
    if (!this.hass || !this.config) return nothing;
    void this.tick;
    const c = this.config;
    const now = Date.now();
    const active = activeMoment(this.hass, c, now);
    const d = defaultOf(c);
    const dOn = active === -1 && defaultActive(this.hass, c, now);
    return html`<div class="chips" role="group" aria-label="Moments">
      ${c.show_default === false
        ? nothing
        : this.chip(d.name ?? "Default", d.icon ?? "mdi:lightbulb-auto", dOn, runList(d.run)[0], () => this.tapDefault(dOn))}
      ${(c.moments ?? []).map((m, i) =>
        this.chip(m.name, m.icon ?? "mdi:creation", i === active, runList(m.run)[0], () => this.tapMoment(i, i === active)),
      )}
    </div>`;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 16px 0 12px;
        border-radius: 999px;
        background: var(--moments-tile);
        color: var(--moments-fg);
        font-size: 0.9375rem;
        font-weight: 700;
        white-space: nowrap;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        touch-action: manipulation;
        box-shadow: inset 0 0 0 1px var(--moments-line);
        transition: transform 0.12s ease, background-color 0.2s ease, box-shadow 0.2s ease;
      }
      .chip ha-icon {
        --mdc-icon-size: 18px;
        color: var(--moments-on);
      }
      .chip:active {
        transform: scale(0.96);
      }
      .chip.on {
        background: var(--moments-on);
        color: var(--moments-on-fg);
        box-shadow: 0 6px 18px color-mix(in srgb, var(--moments-on) 30%, transparent);
      }
      .chip.on ha-icon {
        color: inherit;
      }
      @media (prefers-reduced-motion: reduce) {
        .chip {
          transition: none;
        }
        .chip:active {
          transform: none;
        }
      }
    `,
  ];
}
