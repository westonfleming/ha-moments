import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { panel, tokens } from "../styles/tokens";
import { fireMoreInfo, isEntityId, nameOf } from "../helpers";
import { formatDay, formatNumber, formatSpan, formatTime, startOfDay } from "../format";
import { HistoryLoader } from "../data/history";
import { DEFAULT_FINISHED, DEFAULT_RUNNING, programLabel, runsFrom } from "../appliance";
import type { HomeAssistant, LovelaceCardConfig } from "../types";

interface ApplianceConfig extends LovelaceCardConfig {
  name?: string;
  /** Operation state sensor, e.g. Home Connect's sensor.dishwasher_operation_state. */
  status: string;
  /** Program progress in percent. */
  progress?: string;
  /** Timestamp sensor for when the program ends. */
  finish_time?: string;
  /** Selected or active program (select or sensor). */
  program?: string;
  /** Door sensor, "open"/"closed" or on/off. */
  door?: string;
  /** Cumulative energy sensor (kWh), e.g. from a monitoring plug; adds kWh per run. */
  energy?: string;
  running_states?: string[];
  finished_states?: string[];
  /** Days of runs to list. Default 14. */
  days?: number;
  /** Runs listed at most. Default 5. */
  max_runs?: number;
}

const stateText = (s?: string) =>
  !s || s === "unknown" || s === "unavailable" ? "Unavailable" : (s.charAt(0).toUpperCase() + s.slice(1)).replace(/_/g, " ");

/** An appliance's current program with progress and finish time, then its recent runs. */
@customElement("moments-appliance")
export class MomentsAppliance extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config!: ApplianceConfig;
  private history = new HistoryLoader(this);

  static getStubConfig() {
    return { name: "Dishwasher", status: "sensor.dishwasher_operation_state", progress: "sensor.dishwasher_program_progress", finish_time: "sensor.dishwasher_program_finish_time" };
  }

  setConfig(config: ApplianceConfig) {
    if (!config || !isEntityId(config.status)) throw new Error("moments-appliance: status must be an entity id");
    for (const key of ["progress", "finish_time", "program", "door", "energy"] as const)
      if (config[key] !== undefined && !isEntityId(config[key])) throw new Error(`moments-appliance: ${key} must be an entity id`);
    for (const key of ["running_states", "finished_states"] as const) {
      const v = config[key];
      if (v !== undefined && (!Array.isArray(v) || !v.every((x) => typeof x === "string")))
        throw new Error(`moments-appliance: ${key} must be a list of states`);
    }
    for (const key of ["days", "max_runs"] as const) {
      const v = config[key];
      if (v !== undefined && (typeof v !== "number" || v < 1)) throw new Error(`moments-appliance: ${key} must be at least 1`);
    }
    this.config = config;
  }

  getCardSize() {
    return 5;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  protected updated() {
    if (!this.config) return;
    const c = this.config;
    const ids = [c.status, c.program, c.energy].filter((x): x is string => !!x);
    this.history.load(this.hass, ids, new Date(startOfDay(new Date()).getTime() - (c.days ?? 14) * 86400_000));
  }

  private current(now: number) {
    const c = this.config;
    const hass = this.hass!;
    const status = hass.states[c.status]?.state ?? "unknown";
    const running = (c.running_states ?? DEFAULT_RUNNING).map((s) => s.toLowerCase()).includes(status.toLowerCase());
    const finished = (c.finished_states ?? DEFAULT_FINISHED).map((s) => s.toLowerCase()).includes(status.toLowerCase());
    const program = programLabel(c.program ? hass.states[c.program]?.state : undefined);
    const progress = c.progress ? Number(hass.states[c.progress]?.state) : NaN;
    const finishIso = c.finish_time ? hass.states[c.finish_time]?.state : undefined;
    const finishAt = finishIso ? new Date(finishIso).getTime() : NaN;
    const locale = hass.locale;
    if (running) {
      const left = Number.isFinite(finishAt) ? (finishAt - now) / 60000 : NaN;
      return html`<div class="current on">
        <div class="line"><span class="big">${stateText(status)}${program ? ` · ${program}` : ""}</span>
          ${Number.isFinite(progress) ? html`<span class="big num">${formatNumber(progress)}%</span>` : nothing}</div>
        ${Number.isFinite(progress) ? html`<div class="bar"><i style="width:${Math.min(100, Math.max(0, progress))}%"></i></div>` : nothing}
        ${Number.isFinite(finishAt)
          ? html`<div class="sub strong">Finishes ${formatTime(new Date(finishAt), locale)}${left > 0 ? ` · ${formatSpan(left)} left` : ""}</div>`
          : nothing}
      </div>`;
    }
    const changed = hass.states[c.status]?.last_changed;
    return html`<div class="current">
      <div class="line"><span class="big">${stateText(status)}</span>
        ${finished && changed ? html`<span class="sub strong">at ${formatTime(new Date(changed), locale)}</span>` : nothing}</div>
    </div>`;
  }

  render() {
    if (!this.hass || !this.config) return nothing;
    const c = this.config;
    const now = Date.now();
    const status = this.hass.states[c.status];
    const name = c.name ?? (status ? nameOf(status) : c.status);
    const door = c.door ? this.hass.states[c.door]?.state : undefined;
    const doorOpen = door === "open" || door === "on";
    const runs = runsFrom(this.history.data[c.status] ?? [], now, {
      running: c.running_states,
      program: c.program ? this.history.data[c.program] : undefined,
      energy: c.energy ? this.history.data[c.energy] : undefined,
    })
      .filter((r) => !r.ongoing)
      .slice(0, c.max_runs ?? 5);
    const locale = this.hass.locale;
    const showKwh = !!c.energy;
    return html`<div class="panel">
      <div class="head">
        <button class="title" @click=${() => fireMoreInfo(this, c.status)}><h2>${name}</h2></button>
        ${door !== undefined ? html`<span class="sub ${doorOpen ? "warn" : ""}">Door ${doorOpen ? "open" : "closed"}</span>` : nothing}
      </div>
      ${this.current(now)}
      <div class="log">
        <div class="run label ${showKwh ? "kwh" : ""}"><span>Recent</span><span>Program</span><span>Ran</span><span class="r">Took</span>${showKwh ? html`<span class="r">kWh</span>` : nothing}</div>
        ${runs.length
          ? runs.map(
              (r) => html`<div class="run row ${showKwh ? "kwh" : ""}">
                <span class="d">${formatDay(new Date(r.start), locale)}</span>
                <span class="p">${programLabel(r.program) ?? "–"}</span>
                <span class="sub">${formatTime(new Date(r.start), locale)} – ${formatTime(new Date(r.end), locale)}</span>
                <span class="r">${formatSpan((r.end - r.start) / 60000)}</span>
                ${showKwh ? html`<span class="r strong">${r.kwh !== undefined ? formatNumber(r.kwh, 2) : "–"}</span>` : nothing}
              </div>`,
            )
          : html`<div class="row"><span class="empty">No runs in the last ${c.days ?? 14} days</span></div>`}
      </div>
    </div>`;
  }

  static styles = [
    tokens,
    panel,
    css`
      .title {
        background: none;
        padding: 0;
        text-align: left;
      }
      .warn {
        color: var(--moments-warn);
        font-weight: 700;
      }
      .current {
        border-radius: var(--moments-inner-radius);
        background: var(--moments-raised);
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .line {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
      }
      .big {
        font-size: 20px;
        font-weight: 800;
      }
      .strong {
        font-weight: 700;
        color: var(--moments-fg);
      }
      .bar {
        height: 10px;
        border-radius: 5px;
        background: color-mix(in srgb, var(--moments-fg) 8%, var(--moments-tile));
        overflow: hidden;
      }
      .bar i {
        display: block;
        height: 100%;
        border-radius: 5px;
        background: var(--moments-on);
      }
      .log {
        display: flex;
        flex-direction: column;
      }
      .run {
        display: grid;
        grid-template-columns: 96px minmax(0, 1fr) auto 64px;
        gap: 10px;
        align-items: center;
      }
      .run.kwh {
        grid-template-columns: 96px minmax(0, 1fr) auto 64px 52px;
      }
      .run.label {
        padding-bottom: 4px;
      }
      .d {
        font-weight: 600;
      }
      .p {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .r {
        text-align: right;
      }
      @container (max-width: 460px) {
        .run,
        .run.kwh {
          grid-template-columns: 104px minmax(0, 1fr) 60px;
        }
        .run .sub,
        .run.label span:nth-child(3),
        .run .r.strong,
        .run.label span:nth-child(5) {
          display: none;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "moments-appliance": MomentsAppliance;
  }
}
