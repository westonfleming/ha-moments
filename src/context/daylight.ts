import type { HomeAssistant } from "../types";
import { timeOfDay } from "./time-of-day";
import type { ContextTag } from "../config";

export type Daylight = "dark" | "bright";

export const DAYLIGHT: Daylight[] = ["dark", "bright"];

export const DEFAULT_DARK_BELOW = 50;

/**
 * Daylight from an outdoor illuminance sensor. Undefined when no sensor is
 * configured or its state is not a number, so callers can ignore daylight.
 */
export const daylight = (
  hass: HomeAssistant | undefined,
  entity: string | undefined,
  darkBelow = DEFAULT_DARK_BELOW,
): Daylight | undefined => {
  if (!entity) return undefined;
  const lux = Number(hass?.states[entity]?.state);
  if (Number.isNaN(lux)) return undefined;
  return lux < darkBelow ? "dark" : "bright";
};

export interface ContextOptions {
  time_of_day_entity?: string;
  illuminance_entity?: string;
  dark_below?: number;
}

/** All context tags that apply right now, e.g. ["evening", "dark"]. */
export const currentContext = (hass: HomeAssistant | undefined, opts: ContextOptions, now = new Date()): ContextTag[] => {
  const tags: ContextTag[] = [timeOfDay(hass, opts.time_of_day_entity, now)];
  const d = daylight(hass, opts.illuminance_entity, opts.dark_below);
  if (d) tags.push(d);
  return tags;
};
