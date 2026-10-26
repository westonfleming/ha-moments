import { areaOf, domainOf, isVisible } from "../helpers";
import type { AreaRegistryEntry, HomeAssistant, LovelaceCardConfig } from "../types";
import type { Intent, MomentsStrategyConfig, Schedule } from "../config";

export const ROOM_DOMAINS = ["light", "cover", "climate", "fan", "media_player", "switch", "lock"];
const DOMAIN_ORDER = ["light", "climate", "cover", "media_player"];
export const ROOMS_COLUMNS = 3;
export const SCHEDULES_PATH = "schedules";

/** Drops undefined values so generated configs stay clean. */
export const clean = <T extends Record<string, any>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

export const contextOptions = (config: MomentsStrategyConfig) =>
  clean({
    time_of_day_entity: config.time_of_day_entity,
    illuminance_entity: config.illuminance_entity,
    dark_below: config.dark_below,
  });

export const heading = (
  text: string,
  icon?: string | null,
  style?: "title" | "subtitle",
): LovelaceCardConfig =>
  clean({ type: "heading", heading: text, icon: icon ?? undefined, heading_style: style });

export const intentInArea = (intent: Intent, area: string) =>
  intent.area === area || (intent.areas?.includes(area) ?? false);

export const areaIntents = (intents: Intent[] | undefined, area: string) =>
  (intents ?? []).filter((i) => intentInArea(i, area));

export const areaSchedules = (schedules: Schedule[] | undefined, area: string) =>
  (schedules ?? []).filter((s) => s.area === area);

const nameFor = (hass: HomeAssistant, id: string) =>
  String(hass.states[id]?.attributes.friendly_name ?? id);

const rank = (id: string) => {
  const i = DOMAIN_ORDER.indexOf(domainOf(id));
  return i === -1 ? DOMAIN_ORDER.length : i;
};

/** Visible entities of an area, ordered lights, climate, covers, media, others. */
export const areaEntities = (
  hass: HomeAssistant,
  config: MomentsStrategyConfig,
  area: string,
  domains?: string[],
): string[] => {
  const opts = config.areas?.[area] ?? {};
  const allowed = domains ?? opts.domains ?? ROOM_DOMAINS;
  const exclude = opts.exclude ?? [];
  return Object.keys(hass.states)
    .filter(
      (id) =>
        allowed.includes(domainOf(id)) &&
        !exclude.includes(id) &&
        isVisible(hass, id) &&
        areaOf(hass, id) === area,
    )
    .sort((a, b) => rank(a) - rank(b) || nameFor(hass, a).localeCompare(nameFor(hass, b)));
};

const brightnessCapable = (hass: HomeAssistant, id: string) => {
  const modes: string[] | undefined = hass.states[id]?.attributes.supported_color_modes;
  return !modes || modes.some((m) => m !== "onoff");
};

/** Tile feature for an entity, or none. */
export const tileFeatures = (hass: HomeAssistant, id: string): LovelaceCardConfig[] => {
  switch (domainOf(id)) {
    case "light":
      return brightnessCapable(hass, id) ? [{ type: "light-brightness" }] : [];
    case "cover":
      return [{ type: "cover-open-close" }];
    case "climate":
      return [{ type: "target-temperature" }];
    default:
      return [];
  }
};

export const tile = (hass: HomeAssistant, entity: string, withFeatures = true): LovelaceCardConfig => {
  const features = withFeatures ? tileFeatures(hass, entity) : [];
  return features.length
    ? { type: "tile", entity, features, features_position: "bottom", grid_options: { columns: 12 } }
    : { type: "tile", entity };
};

export interface AreaGroup {
  name?: string;
  icon?: string;
  areas: AreaRegistryEntry[];
}

const byName = (a: AreaRegistryEntry, b: AreaRegistryEntry) => a.name.localeCompare(b.name);

/**
 * Groups for the Rooms view: config.room_groups in order, else HA floors by
 * level with floorless areas under "Other", else one ungrouped list.
 */
export const areaGroups = (
  hass: HomeAssistant,
  config: MomentsStrategyConfig,
  include: (area: string) => boolean = () => true,
): AreaGroup[] => {
  const hidden = new Set(config.hide_areas ?? []);
  const all = Object.values(hass.areas ?? {}).filter((a) => !hidden.has(a.area_id) && include(a.area_id));
  const groups: AreaGroup[] = [];
  const placed = new Set<string>();
  const push = (group: AreaGroup) => {
    group.areas = group.areas.filter((a) => !placed.has(a.area_id));
    group.areas.forEach((a) => placed.add(a.area_id));
    if (group.areas.length) groups.push(group);
  };

  if (config.room_groups?.length) {
    const lookup = new Map(all.map((a) => [a.area_id, a]));
    for (const g of config.room_groups) {
      const areas = g.areas.map((id) => lookup.get(id)).filter((a): a is AreaRegistryEntry => !!a);
      push({ name: g.name, icon: g.icon, areas });
    }
    push({ name: "Other", areas: all.filter((a) => !placed.has(a.area_id)).sort(byName) });
    return groups;
  }

  const floors = Object.values(hass.floors ?? {}).sort(
    (a, b) => (a.level ?? Infinity) - (b.level ?? Infinity) || a.name.localeCompare(b.name),
  );
  if (!floors.length) {
    push({ areas: [...all].sort(byName) });
    return groups;
  }
  for (const f of floors) {
    push({
      name: f.name,
      icon: f.icon ?? undefined,
      areas: all.filter((a) => a.floor_id === f.floor_id).sort(byName),
    });
  }
  push({ name: "Other", areas: all.filter((a) => !placed.has(a.area_id)).sort(byName) });
  return groups;
};

/** Sections for one area of the Rooms view. */
export const areaSection = (
  hass: HomeAssistant,
  config: MomentsStrategyConfig,
  area: AreaRegistryEntry,
): LovelaceCardConfig | undefined => {
  const id = area.area_id;
  const entities = areaEntities(hass, config, id);
  const intents = areaIntents(config.intents, id);
  const schedules = config.room_schedules === false ? [] : areaSchedules(config.schedules, id);
  if (!entities.length && !intents.length && !schedules.length) return undefined;

  const compact =
    config.areas?.[id]?.compact ?? (entities.length <= 3 && !intents.length && !schedules.length);
  if (compact) {
    return {
      type: "grid",
      cards: [heading(area.name, area.icon, "subtitle"), ...entities.map((e) => tile(hass, e, false))],
    };
  }
  return {
    type: "grid",
    cards: [
      heading(area.name, area.icon),
      ...(intents.length
        ? [{ type: "custom:moments-intents", intents, area: id, include_house: false, ...contextOptions(config) }]
        : []),
      ...entities.map((e) => tile(hass, e)),
      ...(schedules.length
        ? [{ type: "custom:moments-schedules", schedules, area: id, summary: true, path: SCHEDULES_PATH }]
        : []),
    ],
  };
};

export const roomsView = (config: MomentsStrategyConfig, hass: HomeAssistant) => {
  const sections: LovelaceCardConfig[] = [];
  for (const group of areaGroups(hass, config)) {
    const areaSections = group.areas
      .map((a) => areaSection(hass, config, a))
      .filter((s): s is LovelaceCardConfig => !!s);
    if (!areaSections.length) continue;
    if (group.name) {
      sections.push({
        type: "grid",
        column_span: ROOMS_COLUMNS,
        cards: [heading(group.name, group.icon, "title")],
      });
    }
    sections.push(...areaSections);
  }
  return {
    title: "Rooms",
    path: "rooms",
    icon: "mdi:floor-plan",
    type: "sections",
    max_columns: ROOMS_COLUMNS,
    sections,
  };
};
