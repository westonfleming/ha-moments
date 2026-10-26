import type { HomeAssistant } from "../types";

export type TimeOfDay = "morning" | "day" | "evening" | "night";

export const TIMES_OF_DAY: TimeOfDay[] = ["morning", "day", "evening", "night"];

/**
 * Current time of day. If `helper` names an input_select (or any entity) whose
 * state is one of TIMES_OF_DAY, that wins, so automations can steer it.
 * Otherwise the local clock decides.
 */
export const timeOfDay = (hass?: HomeAssistant, helper?: string, now = new Date()): TimeOfDay => {
  const state = helper ? hass?.states[helper]?.state : undefined;
  if (state && (TIMES_OF_DAY as string[]).includes(state)) return state as TimeOfDay;
  const h = now.getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17 && h < 22) return "evening";
  return "night";
};

export const greeting = (tod: TimeOfDay) =>
  ({ morning: "Good morning", day: "Good afternoon", evening: "Good evening", night: "Good night" })[tod];
