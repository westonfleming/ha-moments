import type { ContextTag, Intent } from "./config";
import type { HomeAssistant } from "./types";
import { areaOf, domainOf } from "./helpers";
import { entitiesInArea } from "./metrics";
import { TIMES_OF_DAY } from "./context/time-of-day";
import { DAYLIGHT } from "./context/daylight";

export const CONTEXT_TAGS: ContextTag[] = [...TIMES_OF_DAY, ...DAYLIGHT];

/** Without known lights, a scene counts as active this long after it was last turned on. */
export const SCENE_ACTIVE_MS = 4 * 60 * 60 * 1000;

export interface IntentScope {
  /** The card's own area. */
  area?: string;
  /** The current user's area from areas_by_user. */
  userArea?: string;
  /** The card's `lights`, used for every scene's active state. */
  lights?: string[];
}

export interface IntentGroup {
  /** Room context of this group; undefined for house-level intents. */
  area?: string;
  intents: Intent[];
}

export const isHouseIntent = (intent: Intent) => !intent.area && !intent.areas?.length;

export const matchesArea = (intent: Intent, area: string) =>
  intent.area === area || !!intent.areas?.includes(area);

/**
 * The shown intents, grouped by scope. With the card's `area`, intents without an
 * area belong to it and intents of other areas are hidden. Otherwise the user's
 * area group (if any) comes first, then house intents.
 */
export const intentGroups = (intents: Intent[], scope: IntentScope): IntentGroup[] => {
  const house: IntentGroup = { intents: intents.filter(isHouseIntent) };
  const inArea = (area: string): IntentGroup => ({ area, intents: intents.filter((i) => matchesArea(i, area)) });
  let groups: IntentGroup[];
  if (scope.area) {
    const area = scope.area;
    groups = [{ area, intents: intents.filter((i) => isHouseIntent(i) || matchesArea(i, area)) }];
  } else if (scope.userArea) groups = [inArea(scope.userArea), house];
  else groups = [house];
  return groups.filter((g) => g.intents.length);
};

/** The shown intents as one list, area intents before house intents. */
export const intentsFor = (intents: Intent[], scope: IntentScope): Intent[] =>
  intentGroups(intents, scope).flatMap((g) => g.intents);

/** Intents whose `when` matches a current tag come first; otherwise config order is kept. */
export const orderByContext = (intents: Intent[], tags: ContextTag[]): Intent[] => {
  const now = (i: Intent) => !!i.when?.some((t) => tags.includes(t));
  return [...intents.filter(now), ...intents.filter((i) => !now(i))];
};

export interface ServiceCall {
  domain: string;
  service: string;
  data: Record<string, any>;
}

/** The service that runs an intent. Scripts get `variables.area_id` in an area context. */
export const serviceFor = (intent: Intent, areaId?: string): ServiceCall => {
  const domain = domainOf(intent.entity);
  const data: Record<string, any> = { entity_id: intent.entity };
  if (domain === "automation") return { domain, service: "trigger", data };
  if (domain === "button" || domain === "input_button") return { domain, service: "press", data };
  if (domain === "script" && areaId) data.variables = { area_id: areaId };
  return { domain, service: "turn_on", data };
};

const activatedAt = (hass: HomeAssistant, entityId: string): number | undefined => {
  const t = Date.parse(hass.states[entityId]?.state ?? "");
  return Number.isNaN(t) ? undefined : t;
};

const isLight = (id: string) => domainOf(id) === "light";

/**
 * The lights an intent controls, for its active state and for turning them off.
 * In order: the intent's `lights`, the card's `lights`, the scene's own members
 * (`entity_id` attribute), the Hue room or zone the scene belongs to (`group_name`),
 * then the lights in the intent's area (its `area`, the card's area, or the scene's area).
 * Empty when none are known.
 */
export const lightsFor = (hass: HomeAssistant, intent: Intent, scope: IntentScope = {}): string[] => {
  if (intent.lights) return intent.lights;
  if (scope.lights) return scope.lights;
  const scene = hass.states[intent.entity];
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
  const area = intent.area ?? (intent.areas?.length === 1 ? intent.areas[0] : undefined) ?? scope.area ?? areaOf(hass, intent.entity);
  return area ? entitiesInArea(hass, area).filter(isLight) : [];
};

/** Lights turn on a moment after the scene's timestamp. */
const SCENE_SETTLE_MS = 15_000;

const norm = (s: unknown) => (typeof s === "string" ? s.trim().toLowerCase() : "");

/** Whether a select (e.g. Hue's active scene) names this scene. */
const selectNames = (hass: HomeAssistant, intent: Intent, value: string) => {
  const v = norm(value);
  if (!v) return false;
  const scene = hass.states[intent.entity];
  const friendly = norm(scene?.attributes.friendly_name);
  return [intent.name, scene?.attributes.name, friendly].some((n) => norm(n) === v) || friendly.endsWith(` ${v}`);
};

/**
 * Whether an intent is active.
 *
 * A running script is active. `active_entity` decides when set: "on", or for a
 * select (such as Hue's active scene) its option naming the scene. A scene is
 * active when it is the most recently activated of the `shown` scenes over the
 * same lights. When its lights are known ({@link lightsFor}) they must be on, and
 * turned on no earlier than the scene, so a scene goes inactive once its lights go
 * off or are switched back on by hand. With no known lights, a scene counts as
 * active for 4 hours.
 */
export const isActive = (
  hass: HomeAssistant | undefined,
  intent: Intent,
  shown: Intent[] = [intent],
  now = Date.now(),
  scope: IntentScope = {},
): boolean => {
  if (!hass) return false;
  const domain = domainOf(intent.entity);
  if (domain === "script" && !intent.active_entity) return hass.states[intent.entity]?.state === "on";
  if (domain !== "scene" && !intent.active_entity) return false;

  const lights = domain === "scene" ? lightsFor(hass, intent, scope) : [];
  const on = lights.map((id) => hass.states[id]).filter((e) => e?.state === "on");
  if (lights.length && !on.length) return false;

  if (intent.active_entity) {
    const state = hass.states[intent.active_entity]?.state;
    const d = domainOf(intent.active_entity);
    return d === "select" || d === "input_select" ? selectNames(hass, intent, state ?? "") : state === "on";
  }

  const at = activatedAt(hass, intent.entity);
  if (at === undefined || at > now + 60_000) return false;
  if (lights.length) {
    const onSince = Math.min(...on.map((e) => Date.parse(e!.last_changed)).filter((t) => !Number.isNaN(t)));
    if (Number.isFinite(onSince) && onSince > at + SCENE_SETTLE_MS) return false;
  } else if (now - at > SCENE_ACTIVE_MS) return false;

  return shown.every((other) => {
    if (other === intent || domainOf(other.entity) !== "scene" || other.active_entity) return true;
    if (lights.length) {
      const theirs = lightsFor(hass, other, scope);
      if (!theirs.some((id) => lights.includes(id))) return true;
    }
    const t = activatedAt(hass, other.entity);
    return t === undefined || t <= at;
  });
};

/** Throws a clear error for a malformed intents list. */
export const validateIntents = (intents: unknown): Intent[] => {
  if (!Array.isArray(intents) || !intents.length) {
    throw new Error("moments-intents needs a list of intents, e.g. intents: [{ entity: scene.relax }]");
  }
  intents.forEach((intent: any, n) => {
    if (!intent || typeof intent.entity !== "string" || !intent.entity.includes(".")) {
      throw new Error(`moments-intents: intent ${n + 1} needs an entity, e.g. entity: scene.relax`);
    }
    if (intent.when !== undefined) {
      if (!Array.isArray(intent.when)) {
        throw new Error(`moments-intents: "when" of ${intent.entity} must be a list, e.g. when: [evening, dark]`);
      }
      const bad = intent.when.filter((t: unknown) => !(CONTEXT_TAGS as unknown[]).includes(t));
      if (bad.length) {
        throw new Error(
          `moments-intents: unknown "when" value ${bad.map((b: unknown) => `"${b}"`).join(", ")} on ${intent.entity}. ` +
            `Use any of: ${CONTEXT_TAGS.join(", ")}`,
        );
      }
    }
    if (intent.areas !== undefined && !Array.isArray(intent.areas)) {
      throw new Error(`moments-intents: "areas" of ${intent.entity} must be a list of area ids`);
    }
  });
  return intents as Intent[];
};
