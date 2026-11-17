// Configuration types shared by the cards.
// Every option is optional; nothing here is specific to one home.

import type { TimeOfDay } from "./context/time-of-day";
import type { Daylight } from "./context/daylight";

/** A context tag: a time of day or a daylight level. */
export type ContextTag = TimeOfDay | Daylight;

export interface Schedule {
  name: string;
  icon?: string;
  /** The automation that runs the schedule; its on/off state enables it. */
  automation: string;
  /** input_datetime (time only) holding when it runs. Omit for sun-based schedules. */
  time_entity?: string;
  /** input_boolean per weekday, Monday first (7 entries). */
  days_entities?: string[];
  /** input_number holding a sun offset in minutes; used with `sun`. */
  offset_entity?: string;
  /** Sun-based trigger instead of a fixed time. */
  sun?: "sunrise" | "sunset";
  /** Area-scoped schedule. */
  area?: string;
}

export interface AreaGroup {
  name: string;
  areas: string[];
  icon?: string;
  /** Show this group's "on" entities in On now under the group name (e.g. outside lights). */
  show_on_now?: boolean;
}

/** An appliance that gets a "finished" chip when it reaches `state`. */
export interface FinishedEntity {
  entity: string;
  state: string;
  name?: string;
}
