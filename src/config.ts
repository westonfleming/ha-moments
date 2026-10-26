// Configuration contract shared by the strategy and the cards.
// Every option is optional; nothing here is specific to one home.

import type { TimeOfDay } from "./context/time-of-day";
import type { Daylight } from "./context/daylight";

/** A context tag an intent can be promoted by: a time of day or a daylight level. */
export type ContextTag = TimeOfDay | Daylight;

export interface Intent {
  /** scene, script, automation or button. */
  entity: string;
  name?: string;
  /** Second line under the name, e.g. "Dim + music". */
  label?: string;
  icon?: string;
  /** Contexts in which this intent moves to the front. */
  when?: ContextTag[];
  /** Room-level intent for one area. Without area/areas, the intent is house-level. */
  area?: string;
  /** Room-level intent shared by several areas. Scripts receive `area_id`. */
  areas?: string[];
  /** Entity whose "on" state marks this intent active (for scenes, which have no on state). */
  active_entity?: string;
}

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
  /** Room-scoped schedule. */
  area?: string;
}

export interface RoomGroup {
  name: string;
  areas: string[];
  icon?: string;
  /** Show this group's "on" entities in On now under the group name (e.g. outside lights). */
  show_on_now?: boolean;
}

export interface AreaOptions {
  /** Render as a single compact row. Defaults to true when the area has <= 3 entities. */
  compact?: boolean;
  domains?: string[];
  exclude?: string[];
}

export interface MomentsStrategyConfig {
  type: "custom:moments";
  /** Entity whose state is morning/day/evening/night. Default: the clock. */
  time_of_day_entity?: string;
  /** Outdoor illuminance sensor (lux). Enables the `dark`/`bright` contexts. */
  illuminance_entity?: string;
  /** Below this lux it is `dark`. Default 50. */
  dark_below?: number;
  /** Weather entity for the header. Default: first weather.* entity. */
  weather_entity?: string;
  /** Indoor temperature sensor for the header. */
  temperature_entity?: string;
  intents?: Intent[];
  /** Media players shown on Now while playing. Default: all. */
  media_players?: string[];
  /** HA user id -> area id. That user's Now view leads with "This room". */
  rooms_by_user?: Record<string, string>;
  /** Groups for the Rooms view. Default: HA floors. */
  room_groups?: RoomGroup[];
  /** Areas left out of the Rooms view. */
  hide_areas?: string[];
  /** Per-area overrides for the Rooms view. */
  areas?: Record<string, AreaOptions>;
  schedules?: Schedule[];
  /** Show the one-line schedule summary in room sections. Default true. */
  room_schedules?: boolean;
  /** Chips options passed to moments-chips. */
  chips?: { battery_threshold?: number; exclude?: string[]; finished?: FinishedEntity[]; schedules_off_after_hours?: number };
  /** On now options passed to moments-on-now. */
  on_now?: { domains?: string[]; exclude?: string[] };
}

/** An appliance that gets a "finished" chip when it reaches `state`. */
export interface FinishedEntity {
  entity: string;
  state: string;
  name?: string;
}
