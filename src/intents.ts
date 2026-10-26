import type { ContextTag, Intent } from "./config";
import type { HomeAssistant } from "./types";
import { domainOf } from "./helpers";
import { TIMES_OF_DAY } from "./context/time-of-day";
import { DAYLIGHT } from "./context/daylight";

export const CONTEXT_TAGS: ContextTag[] = [...TIMES_OF_DAY, ...DAYLIGHT];

/** A scene counts as active this long after it was last turned on. */
export const SCENE_ACTIVE_MS = 4 * 60 * 60 * 1000;

export interface IntentScope {
  /** The card's own area. */
  area?: string;
  /** The current user's room from rooms_by_user. */
  userArea?: string;
  /** With `area`, also show house-level intents. */
  includeHouse?: boolean;
}

export interface IntentGroup {
  /** Room context of this group; undefined for house-level intents. */
  area?: string;
  intents: Intent[];
}

export const isHouseIntent = (intent: Intent) => !intent.area && !intent.areas?.length;

export const matchesArea = (intent: Intent, area: string) =>
  intent.area === area || !!intent.areas?.includes(area);

/** The shown intents, grouped by scope: a room group (if any) first, then house intents. */
export const intentGroups = (intents: Intent[], scope: IntentScope): IntentGroup[] => {
  const house: IntentGroup = { intents: intents.filter(isHouseIntent) };
  const room = (area: string): IntentGroup => ({ area, intents: intents.filter((i) => matchesArea(i, area)) });
  let groups: IntentGroup[];
  if (scope.area) groups = scope.includeHouse ? [room(scope.area), house] : [room(scope.area)];
  else if (scope.userArea) groups = [room(scope.userArea), house];
  else groups = [house];
  return groups.filter((g) => g.intents.length);
};

/** The shown intents as one list, room intents before house intents. */
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

/** The service that runs an intent. Scripts get `variables.area_id` in a room context. */
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

/**
 * Whether an intent is active. `active_entity`, when set, decides alone. Otherwise a
 * running script is active, and a scene is active when it is the most recently
 * activated of the `shown` scenes and was activated within the last 4 hours.
 */
export const isActive = (
  hass: HomeAssistant | undefined,
  intent: Intent,
  shown: Intent[] = [intent],
  now = Date.now(),
): boolean => {
  if (!hass) return false;
  if (intent.active_entity) return hass.states[intent.active_entity]?.state === "on";
  const domain = domainOf(intent.entity);
  if (domain === "script") return hass.states[intent.entity]?.state === "on";
  if (domain !== "scene") return false;
  const at = activatedAt(hass, intent.entity);
  if (at === undefined || now - at > SCENE_ACTIVE_MS || at > now + 60_000) return false;
  return shown.every((other) => {
    if (domainOf(other.entity) !== "scene" || other.active_entity) return true;
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
