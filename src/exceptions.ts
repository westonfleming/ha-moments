// Pure logic behind the chips and On now cards.

import type { FinishedEntity, RoomGroup, Schedule } from "./config";
import { areaOf, domainOf, isVisible, nameOf } from "./helpers";
import type { HassEntity, HomeAssistant } from "./types";

export type ChipSeverity = "alert" | "warn" | "info";

export interface Chip {
  entityId: string;
  label: string;
  severity: ChipSeverity;
}

export interface ChipsOptions {
  battery_threshold?: number;
  exclude?: string[];
  finished?: FinishedEntity[];
  schedules?: Schedule[];
  schedules_off_after_hours?: number;
}

const OPENINGS = ["door", "window", "garage_door", "opening"];
const HAZARDS = ["problem", "moisture", "smoke", "gas"];
const SEVERITY_ORDER: Record<ChipSeverity, number> = { alert: 0, warn: 1, info: 2 };

export const isUnusable = (e: HassEntity) => e.state === "unavailable" || e.state === "unknown";

/** "12 min", "3 h", "2 d". */
export const formatDuration = (minutes: number) => {
  const m = Math.max(0, Math.floor(minutes));
  if (m < 60) return `${m} min`;
  if (m < 60 * 24) return `${Math.floor(m / 60)} h`;
  return `${Math.floor(m / (60 * 24))} d`;
};

const minutesBetween = (iso: string, now: Date) => (now.getTime() - new Date(iso).getTime()) / 60000;

export const chipsFor = (hass: HomeAssistant, config: ChipsOptions = {}, now: Date = new Date()): Chip[] => {
  const exclude = new Set(config.exclude ?? []);
  const threshold = config.battery_threshold ?? 15;
  const chips: Chip[] = [];

  for (const entity of Object.values(hass.states)) {
    const id = entity.entity_id;
    if (exclude.has(id) || isUnusable(entity)) continue;
    const dc = entity.attributes.device_class;
    const domain = domainOf(id);
    if (domain === "binary_sensor" && entity.state === "on") {
      if (OPENINGS.includes(dc)) {
        const open = formatDuration(minutesBetween(entity.last_changed, now));
        chips.push({ entityId: id, label: `${nameOf(entity)} open ${open}`, severity: "alert" });
      } else if (HAZARDS.includes(dc)) {
        chips.push({ entityId: id, label: nameOf(entity), severity: "alert" });
      }
    } else if (domain === "sensor" && dc === "battery") {
      const level = Number(entity.state);
      if (entity.state !== "" && !Number.isNaN(level) && level < threshold) {
        chips.push({ entityId: id, label: `${nameOf(entity)} ${level}%`, severity: "warn" });
      }
    }
  }

  for (const f of config.finished ?? []) {
    const entity = hass.states[f.entity];
    if (exclude.has(f.entity) || !entity || isUnusable(entity) || entity.state !== f.state) continue;
    chips.push({ entityId: f.entity, label: `${f.name ?? nameOf(entity)} finished`, severity: "info" });
  }

  const hours = config.schedules_off_after_hours;
  if (hours !== undefined && hours >= 0) {
    for (const s of config.schedules ?? []) {
      const automation = hass.states[s.automation];
      if (exclude.has(s.automation) || !automation || isUnusable(automation) || automation.state !== "off") continue;
      if (minutesBetween(automation.last_changed, now) > hours * 60) {
        chips.push({ entityId: s.automation, label: `${s.name} schedule off`, severity: "info" });
      }
    }
  }

  return chips
    .map((c, i) => ({ c, i }))
    .sort((a, b) => SEVERITY_ORDER[a.c.severity] - SEVERITY_ORDER[b.c.severity] || a.i - b.i)
    .map(({ c }) => c);
};

export interface OnNowOptions {
  domains?: string[];
  exclude?: string[];
  groups?: RoomGroup[];
}

export interface OnNowItem {
  entity: HassEntity;
  entityId: string;
  name: string;
  areaId?: string;
  areaName?: string;
  /** Group name for show_on_now groups, otherwise the area name. */
  label?: string;
}

export const DEFAULT_ON_NOW_DOMAINS = ["light", "switch", "fan", "cover"];

export const isOn = (e: HassEntity) =>
  domainOf(e.entity_id) === "cover" ? e.state === "open" || e.state === "opening" : e.state === "on";

export const onNowFor = (hass: HomeAssistant, config: OnNowOptions = {}): OnNowItem[] => {
  const domains = config.domains ?? DEFAULT_ON_NOW_DOMAINS;
  const switchesExplicit = config.domains?.includes("switch") ?? false;
  const exclude = new Set(config.exclude ?? []);
  const groupByArea = new Map<string, string>();
  for (const g of config.groups ?? []) {
    if (!g.show_on_now) continue;
    for (const a of g.areas) if (!groupByArea.has(a)) groupByArea.set(a, g.name);
  }

  const items: OnNowItem[] = [];
  for (const entity of Object.values(hass.states)) {
    const id = entity.entity_id;
    const domain = domainOf(id);
    if (!domains.includes(domain) || exclude.has(id) || !isVisible(hass, id) || !isOn(entity)) continue;
    const areaId = areaOf(hass, id);
    if (domain === "switch" && !areaId && !switchesExplicit) continue;
    const areaName = areaId ? hass.areas?.[areaId]?.name ?? areaId : undefined;
    const label = (areaId && groupByArea.get(areaId)) || areaName;
    items.push({ entity, entityId: id, name: nameOf(entity), areaId, areaName, label });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
};

/** Items grouped under their label, labels sorted, unlabelled last. */
export const groupOnNow = (items: OnNowItem[]) => {
  const groups = new Map<string, OnNowItem[]>();
  for (const item of items) {
    const key = item.label ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)))
    .map(([label, items]) => ({ label: label || undefined, items }));
};
