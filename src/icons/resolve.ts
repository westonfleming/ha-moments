import { DEFAULT_FINISHED, DEFAULT_RUNNING } from "../appliance";
import { domainOf } from "../helpers";
import type { HassEntity } from "../types";
import { ICON_SETS } from "./generated";

const AIR_CLASSES = ["carbon_dioxide", "pm25", "pm10", "pm1", "volatile_organic_compounds", "volatile_organic_compounds_parts", "aqi", "nitrogen_dioxide", "ozone"];

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
      if (dc === "door") return "door";
      if (dc === "garage") return "garage";
      if (dc === "gate") return "gate";
      if (dc === "curtain") return "curtain";
      if (dc === "window") return "window";
      return "blind";
    case "media_player":
      return dc === "tv" ? "tv" : "speaker";
    case "vacuum":
      return "vacuum";
    case "lawn_mower":
      return "mower";
    case "humidifier":
      return "humidifier";
    case "water_heater":
      return "water_heater";
    case "valve":
      return "valve";
    case "alarm_control_panel":
      return "alarm";
    case "camera":
      return "camera";
    case "siren":
      return "siren";
    case "person":
    case "device_tracker":
      return "person";
    case "update":
      return "update";
    case "binary_sensor":
      switch (dc) {
        case "door":
        case "opening":
          return "door";
        case "window":
          return "window";
        case "garage_door":
          return "garage";
        case "motion":
        case "occupancy":
        case "presence":
          return "motion";
        case "smoke":
          return "smoke";
        case "carbon_monoxide":
          return "co";
        case "gas":
          return "gas";
        case "moisture":
          return "leak";
        case "problem":
        case "safety":
        case "tamper":
          return "problem";
        case "connectivity":
          return "connectivity";
        case "battery":
        case "battery_charging":
          return "battery";
        case "running":
          return "running";
        case "vibration":
        case "moving":
          return "vibration";
        case "sound":
          return "sound";
        case "update":
          return "update";
        case "lock":
          return "lock";
        case "plug":
        case "power":
          return "plug";
        case "cold":
        case "heat":
          return "temp";
        case "light":
          return "lux";
      }
      return undefined;
    case "sensor":
      if (dc === "temperature") return "temp";
      if (dc === "illuminance") return "lux";
      if (dc === "humidity") return "humidity";
      if (dc === "battery") return "battery";
      if (dc && AIR_CLASSES.includes(dc)) return "air";
      return undefined;
  }
  return undefined;
};

/** Where air quality turns fair and poor, per device class (CO₂ and PM2.5 match moments-metric). */
const AIR_LEVELS: Record<string, [number, number]> = {
  carbon_dioxide: [800, 1200],
  pm25: [12, 35],
  pm10: [54, 154],
  pm1: [10, 25],
  volatile_organic_compounds: [300, 1000],
  volatile_organic_compounds_parts: [250, 1000],
  aqi: [51, 101],
  nitrogen_dioxide: [40, 100],
  ozone: [100, 160],
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
  /** Humidity (%) below which the humidity icon shows dry. Default 30. */
  dry_below?: number;
  /** Humidity (%) at or above which it shows humid. Default 60. */
  humid_above?: number;
  /** Air quality reading at or above which the air icon shows fair, and poor. Default: per device class. */
  fair_above?: number;
  poor_above?: number;
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
      // A lock binary_sensor is on while unlocked.
      if (raw === "on" || raw === "off") return raw === "on" ? "unlocked" : "locked";
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
      if (raw === "on" || raw === "off") return raw === "on" ? "bright" : "dark";
      const lx = num(entity.state);
      if (lx === undefined) return "dark";
      if (lx < (opts.dark_below ?? 50)) return "dark";
      return lx >= (opts.bright_above ?? 1000) ? "bright" : "dim";
    }
    case "temp": {
      if (raw === "on" || raw === "off") return raw === "off" ? "comfortable" : a.device_class === "cold" ? "cold" : "hot";
      const t = num(entity.state);
      if (t === undefined) return "comfortable";
      if (t <= (opts.cold_below ?? 15)) return "cold";
      return t >= (opts.hot_above ?? 26) ? "hot" : "comfortable";
    }
    case "window":
      return isOn ? "open" : "closed";
    case "garage":
    case "gate":
    case "valve":
      if (raw === "opening" || raw === "closing") return raw;
      if (raw === "open" || raw === "on") return "open";
      return "closed";
    case "curtain": {
      if (raw === "opening" || raw === "closing") return raw;
      const pos = num(a.current_position);
      if (pos !== undefined) return pos <= 0 ? "closed" : pos >= 100 ? "open" : "partial";
      return raw === "open" ? "open" : "closed";
    }
    case "tv":
    case "speaker":
      if (raw === "playing" || raw === "buffering") return "playing";
      if (raw === "paused") return "paused";
      if (raw === "on" || raw === "idle") return "on";
      return "off";
    case "vacuum":
      if (raw === "cleaning") return "cleaning";
      if (raw === "returning") return "returning";
      if (raw === "docked") return "docked";
      if (raw === "paused") return "paused";
      if (raw === "error") return "error";
      return "idle";
    case "mower":
      if (raw === "mowing") return "mowing";
      if (raw === "returning") return "returning";
      if (raw === "paused") return "paused";
      if (raw === "error") return "error";
      return "docked";
    case "humidifier": {
      if (raw === "off") return "off";
      const action = lower(a.action);
      if (action === "humidifying") return "humidifying";
      if (action === "drying") return "drying";
      if (action === "idle" || action === "off") return action === "off" ? "off" : "idle";
      return a.device_class === "dehumidifier" ? "drying" : "humidifying";
    }
    case "water_heater":
      if (raw === "off") return "off";
      if (raw === "eco" || raw === "heat_pump") return "eco";
      return "heating";
    case "alarm":
      if (raw === "armed_vacation") return "armed_away";
      if (raw === "armed_custom_bypass") return "armed_home";
      if (raw === "disarming") return "arming";
      return states.includes(raw) ? raw : "disarmed";
    case "camera":
      if (raw === "recording" || raw === "streaming" || raw === "idle") return raw;
      return "off";
    case "siren":
      return raw === "on" ? "on" : "off";
    case "person":
      return raw === "home" ? "home" : "away";
    case "smoke":
    case "co":
    case "gas":
    case "sound":
    case "vibration":
      return isOn ? "detected" : "clear";
    case "leak":
      return isOn ? "wet" : "dry";
    case "problem":
      return isOn ? "problem" : "ok";
    case "connectivity":
      return isOn ? "connected" : "disconnected";
    case "running":
      return isOn || running ? "running" : "stopped";
    case "battery": {
      if (a.device_class === "battery_charging") return isOn ? "charging" : "full";
      if (raw === "on") return "low";
      if (raw === "off") return "full";
      const pct = num(entity.state);
      if (pct === undefined) return "full";
      if (a.battery_charging === true || a.charging === true) return "charging";
      return pct >= 60 ? "full" : pct >= 25 ? "half" : pct >= 10 ? "low" : "empty";
    }
    case "update":
      if (a.in_progress === true || typeof a.in_progress === "number" || raw === "installing") return "installing";
      return isOn ? "available" : "up_to_date";
    case "humidity": {
      const h = num(entity.state);
      if (h === undefined) return "comfortable";
      if (h < (opts.dry_below ?? 30)) return "dry";
      return h >= (opts.humid_above ?? 60) ? "humid" : "comfortable";
    }
    case "air": {
      const v = num(entity.state);
      if (v === undefined) return "good";
      const [fair, poor] = AIR_LEVELS[a.device_class] ?? [Infinity, Infinity];
      if (v >= (opts.poor_above ?? poor)) return "poor";
      return v >= (opts.fair_above ?? fair) ? "fair" : "good";
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
  "window/open": "#f5a524",
  "garage/open": "#f5a524",
  "garage/opening": "#f5a524",
  "garage/closing": "#f5a524",
  "gate/open": "#f5a524",
  "gate/opening": "#f5a524",
  "gate/closing": "#f5a524",
  "curtain/partial": "#8d77d8",
  "curtain/open": "#8d77d8",
  "curtain/opening": "#8d77d8",
  "curtain/closing": "#8d77d8",
  "tv/playing": "#6e7bff",
  "tv/paused": "#6e7bff",
  "tv/on": "#3a8dff",
  "speaker/playing": "#8b5cf6",
  "speaker/paused": "#f59e0b",
  "speaker/on": "#22b46a",
  "vacuum/cleaning": "#20b2ac",
  "vacuum/returning": "#3a8dff",
  "vacuum/docked": "#22b46a",
  "vacuum/paused": "#f59e0b",
  "vacuum/error": "#ef4438",
  "mower/mowing": "#22b46a",
  "mower/returning": "#3a8dff",
  "mower/paused": "#f59e0b",
  "mower/error": "#ef4438",
  "humidifier/humidifying": "#2d9cf0",
  "humidifier/drying": "#f08a2e",
  "humidifier/idle": "#22b46a",
  "water_heater/heating": "#ff6237",
  "water_heater/eco": "#2dbe76",
  "valve/open": "#2d9cf0",
  "valve/opening": "#f59e0b",
  "valve/closing": "#f59e0b",
  "alarm/armed_home": "#22b46a",
  "alarm/armed_away": "#3a8dff",
  "alarm/armed_night": "#6d5bd6",
  "alarm/arming": "#f59e0b",
  "alarm/pending": "#f59e0b",
  "alarm/triggered": "#ef4438",
  "camera/recording": "#ef4438",
  "camera/streaming": "#3a8dff",
  "siren/on": "#ef4438",
  "person/home": "#f2a33a",
  "smoke/detected": "#ef4438",
  "co/detected": "#ef4438",
  "gas/detected": "#f59e0b",
  "leak/wet": "#2d9cf0",
  "problem/problem": "#ef4438",
  "connectivity/connected": "#20b2ac",
  "connectivity/disconnected": "#ef4438",
  "battery/low": "#f59e0b",
  "battery/empty": "#ef4438",
  "battery/charging": "#22b46a",
  "running/running": "#20b2ac",
  "vibration/detected": "#f2a33a",
  "sound/detected": "#8b5cf6",
  "update/available": "#3a8dff",
  "update/installing": "#8b5cf6",
  "humidity/humid": "#3a8dff",
  "humidity/dry": "#f59e0b",
  "air/good": "#22b46a",
  "air/fair": "#f59e0b",
  "air/poor": "#ef4438",
};

/** True when both are blind position steps, so the shade can glide instead of swapping icons. */
export const isBlindStep = (state: string) => /^\d+$/.test(state);
