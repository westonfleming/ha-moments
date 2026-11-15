import { DEFAULT_FINISHED, DEFAULT_RUNNING } from "../appliance";
import { domainOf } from "../helpers";
import type { HassEntity } from "../types";
import { ICON_SETS } from "./generated";

/** Icon set for an entity when the card config doesn't name one. Undefined means "no Moments icon". */
export const inferIconSet = (entity: HassEntity): string | undefined => {
  const domain = domainOf(entity.entity_id);
  const dc: string | undefined = entity.attributes.device_class;
  switch (domain) {
    case "light":
      return "light";
    case "lock":
      return "lock";
    case "climate":
      return "thermostat";
    case "fan":
      return "fan";
    case "switch":
      return "plug";
    case "cover":
      return dc === "door" || dc === "garage" || dc === "gate" ? "door" : "blind";
    case "binary_sensor":
      if (dc === "door" || dc === "garage_door" || dc === "opening" || dc === "window") return "door";
      if (dc === "motion" || dc === "occupancy" || dc === "presence") return "motion";
      return undefined;
    case "sensor":
      if (dc === "temperature") return "temp";
      if (dc === "illuminance") return "lux";
      return undefined;
  }
  return undefined;
};

export interface ResolveOptions {
  /** Icon state → raw entity states that should show it, e.g. { running: ["Run"] }. Matched case-insensitively. */
  states?: Record<string, string[]>;
  /** Lux below which the light sensor shows dark. */
  dark_below?: number;
  /** Lux from which the light sensor shows bright. */
  bright_above?: number;
  /** Temperature at or below which the temperature icon shows cold. */
  cold_below?: number;
  /** Temperature at or above which it shows hot. */
  hot_above?: number;
}

const lower = (s: unknown) => String(s ?? "").toLowerCase();
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
};
const ON = new Set(["on", "open", "opening", "home", "true", "active", "detected"]);

/** Rounds a cover position up to the next 10% step: 1–10 → 10, only 0 is closed. */
export const blindStep = (position: number) => Math.min(100, Math.max(0, Math.ceil(position / 10) * 10));

/** The icon state to show for an entity in a given icon set. Always one of that set's states. */
export const resolveIconState = (set: string, entity: HassEntity | undefined, opts: ResolveOptions = {}): string => {
  const states = ICON_SETS[set] ?? [];
  const fallback = states.includes("off") ? "off" : states[states.length - 1];
  if (!entity) return fallback;
  const raw = lower(entity.state);

  // Explicit mapping wins.
  for (const [iconState, list] of Object.entries(opts.states ?? {}))
    if (states.includes(iconState) && list.some((s) => lower(s) === raw)) return iconState;

  const a = entity.attributes;
  const isOn = ON.has(raw);
  const running = DEFAULT_RUNNING.includes(raw);
  const finished = DEFAULT_FINISHED.includes(raw);
  switch (set) {
    case "light": {
      if (raw !== "on") return "off";
      const b = num(a.brightness);
      return b !== undefined && b <= 102 ? "dim" : "on";
    }
    case "lock":
      if (raw === "jammed") return "jammed";
      return raw === "locked" || raw === "locking" ? "locked" : "unlocked";
    case "door":
      return isOn ? "open" : "closed";
    case "blind": {
      const pos = num(a.current_position);
      if (pos !== undefined) return String(blindStep(pos));
      if (raw === "opening" || raw === "closing") return raw;
      return raw === "open" ? "100" : "0";
    }
    case "thermostat": {
      const action = lower(a.hvac_action);
      if (action === "heating" || action === "preheating") return "heat";
      if (action === "cooling") return "cool";
      if (action === "idle" || action === "fan" || action === "drying") return "idle";
      if (action === "off" || raw === "off") return "off";
      return raw === "heat" ? "heat" : raw === "cool" ? "cool" : "idle";
    }
    case "plug":
    case "fan":
      return raw === "on" ? "on" : "off";
    case "coffee":
      if (running || raw === "brewing") return "brewing";
      return isOn || raw === "ready" ? "ready" : "off";
    case "washer":
    case "dryer":
      if (running || isOn) return "running";
      return finished || raw === "done" ? "done" : "off";
    case "dishwasher":
      if (running) return "running";
      return isOn || finished || raw === "ready" ? "on" : "off";
    case "fridge":
      return isOn ? "open" : "closed";
    case "freezer":
      return isOn ? "open" : "ok";
    case "motion":
      return isOn ? "detected" : "clear";
    case "lux": {
      const lx = num(entity.state);
      if (lx === undefined) return "dark";
      if (lx < (opts.dark_below ?? 50)) return "dark";
      return lx >= (opts.bright_above ?? 1000) ? "bright" : "dim";
    }
    case "temp": {
      const t = num(entity.state);
      if (t === undefined) return "comfortable";
      if (t <= (opts.cold_below ?? 15)) return "cold";
      return t >= (opts.hot_above ?? 26) ? "hot" : "comfortable";
    }
  }
  return states.includes(raw) ? raw : fallback;
};

/** Accent colour for an icon state; undefined means it's at rest (no tint). */
export const tintFor = (set: string, state: string): string | undefined => {
  if (set === "blind") return state === "0" ? undefined : "#3a98e8";
  return TINTS[`${set}/${state}`];
};

const TINTS: Record<string, string> = {
  "light/on": "#f5a524",
  "light/dim": "#d99a3e",
  "lock/locked": "#22b46a",
  "lock/unlocked": "#f59e0b",
  "lock/jammed": "#ef4438",
  "door/open": "#f5a524",
  "thermostat/heat": "#ff6237",
  "thermostat/cool": "#3a8dff",
  "thermostat/idle": "#2dbe76",
  "plug/on": "#22c86e",
  "fan/on": "#20b2ac",
  "coffee/brewing": "#e8930c",
  "coffee/ready": "#22b46a",
  "washer/running": "#2d9cf0",
  "washer/done": "#22b46a",
  "dryer/running": "#f08a2e",
  "dryer/done": "#22b46a",
  "dishwasher/running": "#2d9cf0",
  "dishwasher/on": "#22b46a",
  "fridge/open": "#f59e0b",
  "freezer/open": "#f59e0b",
  "freezer/warm": "#ef4438",
  "lux/bright": "#e8a400",
  "lux/dim": "#e9785a",
  "lux/dark": "#5468c4",
  "motion/detected": "#8b5cf6",
  "temp/hot": "#ef4438",
  "temp/comfortable": "#22b46a",
  "temp/cold": "#3a8dff",
};

/** True when both are blind position steps, so the shade can glide instead of swapping icons. */
export const isBlindStep = (state: string) => /^\d+$/.test(state);
