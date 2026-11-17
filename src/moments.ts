// Area moments: an area's default light behaviour and the named moments that override it.

import { areaOf, domainOf } from "./helpers";
import { entitiesInArea } from "./metrics";
import type { HassEntity, HomeAssistant } from "./types";

export interface ServiceCall {
  domain: string;
  service: string;
  data: Record<string, any>;
}

/** Without known lights, a moment counts as active this long after it started. */
export const MOMENT_ACTIVE_MS = 4 * 60 * 60 * 1000;

const isLight = (id: string) => domainOf(id) === "light";

/**
 * The lights an entity (usually a scene) sets: the scene's own members (`entity_id`
 * attribute), its Hue room or zone (`group_name`), or the lights in `area` or the
 * entity's own area. Empty when none are found.
 */
export const lightsFor = (hass: HomeAssistant, entityId: string, area?: string): string[] => {
  const scene = hass.states[entityId];
  const members: unknown = scene?.attributes.entity_id;
  if (Array.isArray(members)) {
    const lights = members.filter((id): id is string => typeof id === "string" && isLight(id));
    if (lights.length) return lights;
  }
  const group = scene?.attributes.group_name;
  if (typeof group === "string") {
    const hue = Object.values(hass.states).find(
      (e) => isLight(e.entity_id) && e.attributes.is_hue_group && e.attributes.friendly_name === group,
    );
    if (hue) return [hue.entity_id];
  }
  const where = area ?? areaOf(hass, entityId);
  return where ? entitiesInArea(hass, where).filter(isLight) : [];
};

/** Anything a moment can run: a scene, script, automation or button, or several in order. */
export type RunTarget = string | string[];

export interface Moment {
  name: string;
  icon?: string;
  /** What starts the moment. Scenes and scripts turn on, automations trigger, buttons press. */
  run: RunTarget;
  /** Lights the moment sets. Found from its scene, the card's `lights` or the area otherwise. */
  lights?: string[];
  /**
   * Entity that says the moment is on, for moments the lights can't tell (e.g. an
   * input_boolean or automation). For a select, the option named like the moment.
   */
  active_entity?: string;
  /** State of `active_entity` that means active (default "on", or the moment's name for a select). */
  active_state?: string;
  /** The moment changes its lights by itself (e.g. a dynamic scene): only on/off ends it. */
  dynamic?: boolean;
}

export interface AreaDefault {
  /** Chip name (default "Default"). */
  name?: string;
  icon?: string;
  /** What the default chip runs. Without it, the chip turns the area's lights on. */
  run?: RunTarget;
}

export interface AreaMomentsConfig {
  area?: string;
  /** Lights for every moment and for the default chip. */
  lights?: string[];
  /** A run target, or the default's name, icon and run. */
  default?: RunTarget | AreaDefault;
  moments?: Moment[];
  /** Show the default as the first chip (default true). The card shows nothing without moments. */
  show_default?: boolean;
}

/** Lights turn on a moment after the timestamp of what started them. */
export const SETTLE_MS = 15_000;

export const runList = (run: RunTarget | undefined): string[] => (run === undefined ? [] : Array.isArray(run) ? run : [run]);

export const defaultOf = (c: AreaMomentsConfig): AreaDefault =>
  c.default === undefined ? {} : typeof c.default === "string" || Array.isArray(c.default) ? { run: c.default } : c.default;

/** The service calls that run a target, in order. */
export const callsFor = (run: RunTarget | undefined): ServiceCall[] =>
  runList(run).map((entity_id) => {
    const domain = domainOf(entity_id);
    const data = { entity_id };
    if (domain === "automation") return { domain, service: "trigger", data };
    if (domain === "button" || domain === "input_button") return { domain, service: "press", data };
    return { domain, service: "turn_on", data };
  });

const parse = (v: unknown) => {
  const t = typeof v === "string" ? Date.parse(v) : NaN;
  return Number.isNaN(t) ? undefined : t;
};

/** When an entity last ran: a scene's or button's state, a script's or automation's last_triggered. */
export const ranAt = (e: HassEntity | undefined): number | undefined => {
  if (!e) return undefined;
  const d = domainOf(e.entity_id);
  if (d === "script" || d === "automation") return parse(e.attributes.last_triggered);
  return parse(e.state);
};

/** When a run target last ran (its latest entity). */
export const startedAt = (hass: HomeAssistant, run: RunTarget | undefined): number | undefined => {
  const times = runList(run)
    .map((id) => ranAt(hass.states[id]))
    .filter((t): t is number => t !== undefined);
  return times.length ? Math.max(...times) : undefined;
};

/** The lights a moment sets: its own, the card's, those of its first scene, or the area's. */
export const momentLights = (hass: HomeAssistant, m: Moment, c: AreaMomentsConfig): string[] => {
  if (m.lights) return m.lights;
  if (c.lights) return c.lights;
  const scene = runList(m.run).find((id) => domainOf(id) === "scene") ?? runList(m.run)[0];
  return scene ? lightsFor(hass, scene, c.area) : [];
};

/** The area's lights, for the default chip and for returning to default. */
export const areaLights = (hass: HomeAssistant, c: AreaMomentsConfig): string[] => {
  if (c.lights) return c.lights;
  const d = runList(defaultOf(c).run)[0];
  if (d) {
    const found = lightsFor(hass, d, c.area);
    if (found.length) return found;
  }
  return [...new Set((c.moments ?? []).flatMap((m) => momentLights(hass, m, c)))];
};

const norm = (s: unknown) => (typeof s === "string" ? s.trim().toLowerCase() : "");

const isDynamic = (hass: HomeAssistant, m: Moment) =>
  m.dynamic ?? runList(m.run).some((id) => hass.states[id]?.attributes.is_dynamic === true);

/**
 * Whether a moment's own signals say it is on, ignoring the other moments.
 * - With `active_entity`: its state (and the lights, when known, must be on).
 * - A running script.
 * - Otherwise its lights must be on, switched on no later than the moment started,
 *   and (unless dynamic) not adjusted since. With no known lights, it counts for 4 hours.
 */
export const momentHolds = (
  hass: HomeAssistant,
  m: Moment,
  c: AreaMomentsConfig,
  now = Date.now(),
): boolean => {
  const lights = momentLights(hass, m, c);
  const on = lights.map((id) => hass.states[id]).filter((e): e is HassEntity => e?.state === "on");
  if (lights.length && !on.length) return false;

  if (m.active_entity) {
    const state = hass.states[m.active_entity]?.state;
    const d = domainOf(m.active_entity);
    const want = m.active_state ?? (d === "select" || d === "input_select" ? m.name : "on");
    return norm(state) === norm(want);
  }

  const scripts = runList(m.run).filter((id) => domainOf(id) === "script");
  if (scripts.some((id) => hass.states[id]?.state === "on")) return true;

  const at = startedAt(hass, m.run);
  if (at === undefined || at > now + 60_000) return false;
  if (!lights.length) return now - at <= MOMENT_ACTIVE_MS;
  const after = (e: HassEntity, key: "last_changed" | "last_updated") => {
    const t = parse(e[key]);
    return t !== undefined && t > at + SETTLE_MS;
  };
  // Switched back on by hand after the moment: every lit light changed state later.
  if (on.every((e) => after(e, "last_changed"))) return false;
  // Adjusted since (brightness or colour): any lit light updated later.
  if (!isDynamic(hass, m) && on.some((e) => after(e, "last_updated"))) return false;
  return true;
};

/**
 * The active moment's index, or -1. Of the moments whose signals hold, the one
 * started most recently wins, and a default run after it ends it.
 */
export const activeMoment = (hass: HomeAssistant | undefined, c: AreaMomentsConfig, now = Date.now()): number => {
  if (!hass) return -1;
  const moments = c.moments ?? [];
  const defaultAt = startedAt(hass, defaultOf(c).run) ?? -Infinity;
  let best = -1;
  let bestAt = -Infinity;
  moments.forEach((m, i) => {
    if (!momentHolds(hass, m, c, now)) return;
    const at = m.active_entity ? Infinity : startedAt(hass, m.run) ?? -Infinity;
    if (!m.active_entity && at < defaultAt) return;
    if (best === -1 || at > bestAt) {
      best = i;
      bestAt = at;
    }
  });
  return best;
};

/** The default is active while the area's lights are on and no moment is. */
export const defaultActive = (hass: HomeAssistant | undefined, c: AreaMomentsConfig, now = Date.now()) =>
  !!hass && activeMoment(hass, c, now) === -1 && areaLights(hass, c).some((id) => hass.states[id]?.state === "on");

/** The calls that switch a lit moment off: stop its running scripts, then turn its lights off. */
export const switchOff = (hass: HomeAssistant, m: Moment, c: AreaMomentsConfig): ServiceCall[] => {
  const scripts = runList(m.run).filter((id) => domainOf(id) === "script" && hass.states[id]?.state === "on");
  const lights = momentLights(hass, m, c);
  return [
    ...scripts.map((entity_id) => ({ domain: "script", service: "turn_off", data: { entity_id } })),
    ...(lights.length ? [{ domain: "light", service: "turn_off", data: { entity_id: lights } }] : []),
  ];
};

const isTarget = (v: unknown) =>
  (typeof v === "string" && v.includes(".")) || (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" && x.includes(".")));

/** Throws a clear error for a malformed config. */
export const validateAreaMoments = (c: AreaMomentsConfig | undefined): AreaMomentsConfig => {
  const tag = "moments-area-moments";
  if (!c) throw new Error(`${tag}: missing configuration`);
  const d = c.default;
  if (d !== undefined && !isTarget(d)) {
    if (typeof d !== "object" || Array.isArray(d)) throw new Error(`${tag}: default must be an entity, a list, or { name, run }`);
    if (d.run !== undefined && !isTarget(d.run)) throw new Error(`${tag}: default run must be an entity id or a list of them`);
  }
  if (c.moments !== undefined && !Array.isArray(c.moments)) throw new Error(`${tag}: moments must be a list`);
  (c.moments ?? []).forEach((m: any, n) => {
    if (!m || typeof m.name !== "string" || !m.name) throw new Error(`${tag}: moment ${n + 1} needs a name`);
    if (!isTarget(m.run)) throw new Error(`${tag}: moment "${m.name}" needs run: an entity id or a list, e.g. run: scene.movie`);
    if (m.lights !== undefined && !Array.isArray(m.lights)) throw new Error(`${tag}: lights of "${m.name}" must be a list`);
  });
  if (!c.moments?.length && d === undefined) throw new Error(`${tag}: add a default or at least one moment`);
  return c;
};
