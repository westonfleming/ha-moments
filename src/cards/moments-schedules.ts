import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "../styles/tokens";
import { callWithFeedback, fireMoreInfo, haptic, navigate } from "../helpers";
import {
  DAY_NAMES,
  activeDays,
  dayLabel,
  formatNext,
  isEnabled,
  nextRun,
  scheduleTime,
  summaryText,
  sunOffset,
  validateSchedules,
  visibleSchedules,
} from "../schedules";
import type { HomeAssistant, LovelaceCardConfig } from "../types";
import type { Schedule } from "../config";

interface SchedulesConfig extends LovelaceCardConfig {
  schedules: Schedule[];
  area?: string;
  all?: boolean;
  summary?: boolean;
  path?: string;
}

const LONG_PRESS_MS = 500;

/** Quiet list of schedules whose times live in helpers; edits the helpers, never the automation. */
@customElement("moments-schedules")
export class MomentsSchedules extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: SchedulesConfig;
  @state() private open?: string;
  private pressTimer?: number;
  private longPressed = false;

  static getStubConfig() {
    return { schedules: [] };
  }

  setConfig(config: SchedulesConfig) {
    validateSchedules(config?.schedules);
    this.config = config;
  }

  getCardSize() {
    if (this.config?.summary) return 1;
    return 1 + (this.config?.schedules.length ?? 0);
  }

  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }

  private shown() {
    return visibleSchedules(this.hass!, this.config.schedules, this.config);
  }

  private toggle(s: Schedule) {
    const on = isEnabled(this.hass!, s);
    callWithFeedback(this, this.hass, "automation", on ? "turn_off" : "turn_on", { entity_id: s.automation });
  }

  private setTime(s: Schedule, value: string) {
    if (!s.time_entity || !/^\d{2}:\d{2}/.test(value)) return;
    callWithFeedback(this, this.hass, "input_datetime", "set_datetime", {
      entity_id: s.time_entity,
      time: `${value.slice(0, 5)}:00`,
    });
  }

  private toggleDay(entity: string, on: boolean) {
    callWithFeedback(this, this.hass, "input_boolean", on ? "turn_off" : "turn_on", { entity_id: entity });
  }

  private stepOffset(s: Schedule, delta: number) {
    if (!s.offset_entity) return;
    const attrs = this.hass!.states[s.offset_entity]?.attributes ?? {};
    let value = sunOffset(this.hass!, s) + delta;
    if (typeof attrs.min === "number") value = Math.max(attrs.min, value);
    if (typeof attrs.max === "number") value = Math.min(attrs.max, value);
    callWithFeedback(this, this.hass, "input_number", "set_value", { entity_id: s.offset_entity, value });
  }

  private pressStart(s: Schedule) {
    this.longPressed = false;
    clearTimeout(this.pressTimer);
    this.pressTimer = window.setTimeout(() => {
      this.longPressed = true;
      haptic(this, "medium");
      fireMoreInfo(this, s.automation);
    }, LONG_PRESS_MS);
  }

  private pressEnd() {
    clearTimeout(this.pressTimer);
  }

  private tapRow(s: Schedule) {
    if (this.longPressed) {
      this.longPressed = false;
      return;
    }
    haptic(this, "selection");
    this.open = this.open === s.automation ? undefined : s.automation;
  }

  private navigate() {
    const path = this.config.path;
    if (!path) return;
    haptic(this, "selection");
    navigate(path);
  }

  private switch(on: boolean, label: string, onClick: () => void) {
    return html`<button
      class="switch ${on ? "on" : ""}"
      role="switch"
      aria-checked=${on ? "true" : "false"}
      aria-label=${label}
      @click=${onClick}
    >
      <span class="track"><span class="thumb"></span></span>
    </button>`;
  }

  render() {
    if (!this.hass || !this.config) return nothing;
    const list = this.shown();
    if (this.config.summary) return this.renderSummary(list);
    if (!this.config.schedules.length) return html`<div class="hint">Add schedules in the card config</div>`;
    if (!list.length) return nothing;
    return html`<div class="list">${list.map((s) => this.renderRow(s))}</div>`;
  }

  private renderSummary(list: Schedule[]) {
    if (!list.length) return nothing;
    return html`<button class="summary" ?disabled=${!this.config.path} @click=${() => this.navigate()}>
      <ha-icon icon="mdi:clock-outline"></ha-icon>
      <span>${summaryText(this.hass!, list)}</span>
    </button>`;
  }

  private renderRow(s: Schedule) {
    const hass = this.hass!;
    const on = isEnabled(hass, s);
    const next = nextRun(hass, s);
    const open = this.open === s.automation;
    const secondary = !on ? "off" : next ? `next: ${formatNext(next, new Date(), hass.locale?.language)}` : "no days set";
    return html`<div class="row ${open ? "open" : ""}">
      <div class="head">
        <button
          class="main"
          aria-expanded=${open ? "true" : "false"}
          @click=${() => this.tapRow(s)}
          @pointerdown=${() => this.pressStart(s)}
          @pointerup=${this.pressEnd}
          @pointerleave=${this.pressEnd}
          @pointercancel=${this.pressEnd}
          @contextmenu=${(e: Event) => e.preventDefault()}
        >
          <ha-icon .icon=${s.icon ?? (s.sun === "sunrise" ? "mdi:weather-sunset-up" : s.sun ? "mdi:weather-sunset-down" : "mdi:clock-outline")}></ha-icon>
          <span class="text">
            <span class="primary">${s.name} · ${scheduleTime(hass, s) ?? "--:--"} · ${dayLabel(activeDays(hass, s))}</span>
            <span class="secondary">${secondary}</span>
          </span>
        </button>
        ${this.switch(on, `${s.name} enabled`, () => this.toggle(s))}
      </div>
      ${open ? this.renderEditor(s, on) : nothing}
    </div>`;
  }

  private renderEditor(s: Schedule, on: boolean) {
    const hass = this.hass!;
    const days = activeDays(hass, s);
    const offset = sunOffset(hass, s);
    return html`<div class="editor">
      ${s.time_entity
        ? html`<label class="field">
            <span>Time</span>
            <input
              type="time"
              .value=${scheduleTime(hass, s) ?? ""}
              @change=${(e: Event) => this.setTime(s, (e.target as HTMLInputElement).value)}
            />
          </label>`
        : nothing}
      ${s.sun
        ? html`<div class="field">
            <span>${s.sun === "sunrise" ? "Sunrise" : "Sunset"} ${offset >= 0 ? "+" : "−"}${Math.abs(offset)} min</span>
            ${s.offset_entity
              ? html`<span class="stepper">
                  <button aria-label="5 minutes earlier" @click=${() => this.stepOffset(s, -5)}>
                    <ha-icon icon="mdi:minus"></ha-icon>
                  </button>
                  <button aria-label="5 minutes later" @click=${() => this.stepOffset(s, 5)}>
                    <ha-icon icon="mdi:plus"></ha-icon>
                  </button>
                </span>`
              : nothing}
          </div>`
        : nothing}
      ${s.days_entities?.length === 7
        ? html`<div class="days" role="group" aria-label="Days">
            ${s.days_entities.map(
              (entity, i) => html`<button
                class="day ${days[i] ? "on" : ""}"
                aria-pressed=${days[i] ? "true" : "false"}
                aria-label=${DAY_NAMES[i]}
                @click=${() => this.toggleDay(entity, days[i])}
              >
                ${DAY_NAMES[i].slice(0, 2)}
              </button>`,
            )}
          </div>`
        : nothing}
      <div class="field">
        <span>Enabled</span>
        ${this.switch(on, `${s.name} enabled`, () => this.toggle(s))}
      </div>
    </div>`;
  }

  static styles = [
    tokens,
    css`
      :host {
        display: block;
        color: var(--moments-muted);
        font-size: 14px;
      }
      .hint {
        padding: 12px 4px;
        color: var(--moments-muted);
        font-size: 13px;
      }
      .list {
        display: flex;
        flex-direction: column;
      }
      .row + .row {
        border-top: 1px solid var(--divider-color, color-mix(in srgb, currentColor 12%, transparent));
      }
      .head {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .main {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 52px;
        padding: 6px 4px;
        background: none;
        text-align: left;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
      }
      .main ha-icon {
        --mdc-icon-size: 18px;
        color: var(--moments-muted);
        flex: none;
      }
      .text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .primary,
      .secondary {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .primary {
        color: var(--moments-fg);
        font-size: 14px;
      }
      .secondary {
        font-size: 12px;
        color: var(--moments-muted);
      }
      .switch {
        flex: none;
        width: 52px;
        height: 44px;
        display: grid;
        place-items: center;
        background: none;
        padding: 0;
      }
      .track {
        position: relative;
        width: 36px;
        height: 20px;
        border-radius: 10px;
        background: color-mix(in srgb, var(--moments-muted) 35%, transparent);
      }
      .thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--text-primary-color, #fff);
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
      }
      .switch.on .track {
        background: var(--switch-checked-track-color, var(--primary-color));
      }
      .switch.on .thumb {
        transform: translateX(16px);
      }
      .editor {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 0 4px 12px 34px;
      }
      .field {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 44px;
      }
      input[type="time"] {
        font: inherit;
        color: var(--moments-fg);
        background: transparent;
        border: 1px solid var(--divider-color, color-mix(in srgb, currentColor 20%, transparent));
        border-radius: 8px;
        min-height: 44px;
        padding: 0 10px;
        color-scheme: light dark;
      }
      .stepper {
        display: flex;
        gap: 4px;
      }
      .stepper button {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--moments-muted) 12%, transparent);
        display: grid;
        place-items: center;
      }
      .stepper ha-icon {
        --mdc-icon-size: 18px;
      }
      .days {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 4px;
        max-width: 360px;
      }
      .day {
        min-height: 44px;
        border-radius: 22px;
        background: color-mix(in srgb, var(--moments-muted) 10%, transparent);
        color: var(--moments-muted);
        font-size: 13px;
      }
      .day.on {
        background: color-mix(in srgb, var(--primary-color) 18%, transparent);
        color: var(--moments-fg);
      }
      .summary {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 44px;
        padding: 0 4px;
        background: none;
        color: var(--moments-muted);
        font-size: 13px;
        text-align: left;
      }
      .summary:disabled {
        cursor: default;
      }
      .summary ha-icon {
        --mdc-icon-size: 16px;
      }
      @media (prefers-reduced-motion: no-preference) {
        .thumb {
          transition: transform 0.15s ease;
        }
        .track {
          transition: background-color 0.15s ease;
        }
      }
    `,
  ];
}
