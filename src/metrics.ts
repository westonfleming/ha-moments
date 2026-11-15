// Readings: what kind of sensor something is, how to describe its value, and a small glyph for it.

import { areaOf, domainOf, isVisible } from "./helpers";
import type { HassEntity, HomeAssistant } from "./types";

export type MetricKind = "temperature" | "humidity" | "co2" | "pm25" | "voc" | "illuminance" | "other";

export interface Level {
  /** The level applies while the value is below this. Omit on the last level. */
  below?: number;
  label: string;
  /** good | fair | poor | info, or any CSS colour. */
  color?: string;
}

export const kindOf = (e: HassEntity | undefined): MetricKind => {
  switch (e?.attributes.device_class) {
    case "temperature":
      return "temperature";
    case "humidity":
      return "humidity";
    case "carbon_dioxide":
      return "co2";
    case "pm25":
      return "pm25";
    case "volatile_organic_compounds":
    case "volatile_organic_compounds_parts":
      return "voc";
    case "illuminance":
      return "illuminance";
  }
  return "other";
};

/** Default words for a reading. Temperature has none: its status is its trend. */
export const DEFAULT_LEVELS: Partial<Record<MetricKind, Level[]>> = {
  humidity: [
    { below: 30, label: "Dry", color: "fair" },
    { below: 60, label: "Comfortable", color: "info" },
    { label: "Humid", color: "fair" },
  ],
  co2: [
    { below: 800, label: "Good", color: "good" },
    { below: 1200, label: "Fair", color: "fair" },
    { label: "High", color: "poor" },
  ],
  pm25: [
    { below: 12, label: "Good", color: "good" },
    { below: 35, label: "Fair", color: "fair" },
    { label: "Poor", color: "poor" },
  ],
  illuminance: [
    { below: 50, label: "Dark", color: "#5468c4" },
    { below: 1000, label: "Dim", color: "#e9785a" },
    { label: "Bright", color: "#e8a400" },
  ],
};

const NAMED: Record<string, string> = {
  good: "var(--moments-ok)",
  fair: "var(--moments-warn)",
  poor: "var(--moments-alert)",
  info: "var(--moments-blue)",
};
export const levelColor = (c?: string) => (c ? NAMED[c] ?? c : "var(--moments-muted)");

export const levelFor = (value: number, levels: Level[] | undefined): Level | undefined => {
  if (!levels?.length || !Number.isFinite(value)) return undefined;
  return levels.find((l) => l.below === undefined || value < l.below) ?? levels[levels.length - 1];
};

export const validateLevels = (card: string, levels: unknown) => {
  const ok =
    Array.isArray(levels) &&
    levels.every((l) => l && typeof l.label === "string" && (l.below === undefined || typeof l.below === "number"));
  if (!ok) throw new Error(`${card}: levels must be a list of { below, label, color }`);
};

/** Short label used on chips and metric tiles. */
export const KIND_LABEL: Record<MetricKind, string> = {
  temperature: "Temperature",
  humidity: "Humidity",
  co2: "CO₂",
  pm25: "PM2.5",
  voc: "VOC",
  illuminance: "Light",
  other: "",
};

/** 16px flat glyphs for readings. */
export const GLYPH: Record<MetricKind | "person" | "bulb" | "alert", string> = {
  temperature: `<svg viewBox="0 0 16 16"><path d="M6.5 3a1.5 1.5 0 0 1 3 0v6.3a3 3 0 1 1-3 0Z" fill="none" stroke="#22a46a" stroke-width="1.5"/><circle cx="8" cy="11.5" r="1.4" fill="#22a46a"/></svg>`,
  humidity: `<svg viewBox="0 0 16 16"><path d="M8 2.2c2.6 3.2 4 5.3 4 7.2a4 4 0 0 1-8 0c0-1.9 1.4-4 4-7.2Z" fill="#3a98e8"/></svg>`,
  co2: `<svg viewBox="0 0 16 16"><path d="M2 6h7.5a2 2 0 1 0-2-2M2 9.5h10a2 2 0 1 1-2 2M2 13h5" fill="none" stroke="#22a46a" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  pm25: `<svg viewBox="0 0 16 16"><g fill="#8a8f99"><circle cx="4" cy="5" r="1.5"/><circle cx="9" cy="4" r="1"/><circle cx="12" cy="8" r="1.6"/><circle cx="6" cy="10" r="1.2"/><circle cx="10" cy="12.5" r="1"/></g></svg>`,
  voc: `<svg viewBox="0 0 16 16"><path d="M5 13c-1.6-1.6 1.6-3 0-4.8S6.6 5.2 5 3.5M10 13c-1.6-1.6 1.6-3 0-4.8s1.6-3 0-4.7" fill="none" stroke="#8b5cf6" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  illuminance: `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" fill="#e8a400"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="#e8a400" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  other: `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="none" stroke="#8a8f99" stroke-width="1.5"/></svg>`,
  person: `<svg viewBox="0 0 16 16"><circle cx="8" cy="4.6" r="2.6" fill="#8b5cf6"/><path d="M3 14c.4-3 2.4-4.6 5-4.6s4.6 1.6 5 4.6Z" fill="#8b5cf6"/></svg>`,
  bulb: `<svg viewBox="0 0 16 16"><path d="M5.2 9.6A4 4 0 1 1 10.8 9.6c-.6.6-.8 1.2-.8 1.9H6c0-.7-.2-1.3-.8-1.9Z" fill="#f5a524"/><rect x="6" y="12.3" width="4" height="2" rx=".8" fill="#9ba4b0"/></svg>`,
  alert: `<svg viewBox="0 0 16 16"><path d="M8 2 14.5 13.5h-13Z" fill="#fff"/><rect x="7.2" y="6" width="1.6" height="4" rx=".8" fill="#e5483b"/><circle cx="8" cy="11.6" r=".9" fill="#e5483b"/></svg>`,
};

/** SVG path for a sparkline in a w×h box, plus its last point. */
export const sparkPath = (values: number[], w = 56, h = 22) => {
  if (values.length < 2) return undefined;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / span) * (h - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  return { d, area: `${d}L${w} ${h}L0 ${h}Z`, end: pts[pts.length - 1] };
};

/** Evenly spaced samples of a step series between `from` and `to`. */
export const resample = (points: { t: number; v: number }[], from: number, to: number, n = 24): number[] => {
  if (!points.length) return [];
  const out: number[] = [];
  let i = 0;
  let current: number | undefined;
  for (let k = 0; k < n; k++) {
    const t = from + ((to - from) * k) / (n - 1);
    while (i < points.length && points[i].t <= t) current = points[i++].v;
    if (current !== undefined) out.push(current);
  }
  return out;
};

// ---- Areas ----

/** Entities in an area (directly or through their device), visible ones only. */
export const entitiesInArea = (hass: HomeAssistant, areaId: string) =>
  Object.keys(hass.states).filter((id) => areaOf(hass, id) === areaId && isVisible(hass, id));

const firstWith = (hass: HomeAssistant, ids: string[], domain: string, classes: string[]) =>
  ids.find((id) => domainOf(id) === domain && classes.includes(hass.states[id]?.attributes.device_class));

export interface AreaEntities {
  temperature?: string;
  humidity?: string;
  air?: string;
  illuminance?: string;
  presence?: string;
  lights: string[];
  alerts: string[];
}

/** Finds an area's readings, presence sensor, lights and alert sensors. */
export const discoverArea = (hass: HomeAssistant, areaId: string): AreaEntities => {
  const ids = entitiesInArea(hass, areaId);
  return {
    temperature: firstWith(hass, ids, "sensor", ["temperature"]),
    humidity: firstWith(hass, ids, "sensor", ["humidity"]),
    air: firstWith(hass, ids, "sensor", ["carbon_dioxide", "pm25", "volatile_organic_compounds", "aqi"]),
    illuminance: firstWith(hass, ids, "sensor", ["illuminance"]),
    presence:
      firstWith(hass, ids, "binary_sensor", ["occupancy", "presence"]) ?? firstWith(hass, ids, "binary_sensor", ["motion"]),
    lights: ids.filter((id) => domainOf(id) === "light"),
    alerts: ids.filter(
      (id) => domainOf(id) === "binary_sensor" && ["moisture", "smoke", "gas", "carbon_monoxide", "problem", "safety"].includes(hass.states[id]?.attributes.device_class),
    ),
  };
};

/** "Occupied · 12 min" / "Empty · 2 h", from a presence sensor. */
export const presenceText = (e: HassEntity | undefined, now = Date.now()) => {
  if (!e || e.state === "unavailable" || e.state === "unknown") return undefined;
  const on = e.state === "on";
  const mins = Math.max(0, Math.round((now - new Date(e.last_changed).getTime()) / 60000));
  const since = !Number.isFinite(mins) ? "" : mins < 1 ? "now" : mins < 60 ? `${mins} min` : mins < 48 * 60 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`;
  return { on, text: `${on ? "Occupied" : "Empty"}${since ? ` · ${since}` : ""}` };
};
