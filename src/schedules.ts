import type { Schedule } from "./config";
import type { HomeAssistant } from "./types";

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Monday-first weekday index (0 = Monday). */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

export const isEnabled = (hass: HomeAssistant, s: Schedule) => hass.states[s.automation]?.state === "on";

/** Sun offset in minutes from the offset helper; 0 when unset or unusable. */
export const sunOffset = (hass: HomeAssistant, s: Schedule) => {
  const v = s.offset_entity ? Number(hass.states[s.offset_entity]?.state) : 0;
  return Number.isFinite(v) ? v : 0;
};

/** "HH:MM" the schedule runs at, or undefined when its helper is not usable. */
export const scheduleTime = (hass: HomeAssistant, s: Schedule): string | undefined => {
  if (s.sun) {
    const attr = s.sun === "sunrise" ? "next_rising" : "next_setting";
    const iso = hass.states["sun.sun"]?.attributes[attr];
    const t = iso ? new Date(iso) : undefined;
    if (!t || isNaN(t.getTime())) return undefined;
    return hhmm(new Date(t.getTime() + sunOffset(hass, s) * 60000));
  }
  const m = s.time_entity ? /^(\d{1,2}):(\d{2})/.exec(hass.states[s.time_entity]?.state ?? "") : null;
  return m ? `${pad(Number(m[1]))}:${m[2]}` : undefined;
};

/** Weekdays the schedule runs on, Monday first. All days when there are no day helpers. */
export const activeDays = (hass: HomeAssistant, s: Schedule): boolean[] =>
  s.days_entities?.length
    ? DAY_NAMES.map((_, i) => hass.states[s.days_entities![i]]?.state === "on")
    : DAY_NAMES.map(() => true);

export const dayLabel = (days: boolean[]) => {
  const key = days.map((d) => (d ? 1 : 0)).join("");
  if (key === "1111111") return "Every day";
  if (key === "1111100") return "Weekdays";
  if (key === "0000011") return "Weekends";
  if (key === "0000000") return "No days";
  return DAY_NAMES.filter((_, i) => days[i]).join(", ");
};

/** Next time the schedule will run, or undefined when it is off or has no days. */
export const nextRun = (hass: HomeAssistant, s: Schedule, now = new Date()): Date | undefined => {
  if (!isEnabled(hass, s)) return undefined;
  const time = scheduleTime(hass, s);
  if (!time) return undefined;
  const days = activeDays(hass, s);
  const [h, m] = time.split(":").map(Number);
  for (let i = 0; i <= 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m);
    if (d > now && days[weekdayIndex(d)]) return d;
  }
  return undefined;
};

/** "today 07:00", "tomorrow 07:00" or "Thu 07:00". */
export const formatNext = (date: Date, now = new Date(), locale = "en") => {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(date) - startOf(now)) / 86400000);
  const day =
    days === 0
      ? "today"
      : days === 1
        ? "tomorrow"
        : new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
  return `${day} ${hhmm(date)}`;
};

export interface ScheduleScope {
  area?: string;
  all?: boolean;
}

/** Schedules in scope (area -> that area, none -> house-level, all -> everything), soonest first. */
export const visibleSchedules = (
  hass: HomeAssistant,
  schedules: Schedule[],
  scope: ScheduleScope,
  now = new Date(),
): Schedule[] => {
  const shown = schedules.filter((s) => (scope.all ? true : scope.area ? s.area === scope.area : !s.area));
  const at = (s: Schedule) => nextRun(hass, s, now)?.getTime() ?? Infinity;
  return shown
    .map((s, i) => ({ s, i, t: at(s) }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((x) => x.s);
};

/** "2 schedules · next 07:00", or "· all off" when none will run. */
export const summaryText = (hass: HomeAssistant, schedules: Schedule[], now = new Date()) => {
  const count = `${schedules.length} ${schedules.length === 1 ? "schedule" : "schedules"}`;
  const next = schedules
    .map((s) => nextRun(hass, s, now))
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  return next ? `${count} · next ${hhmm(next)}` : `${count} · all off`;
};

export const validateSchedules = (schedules: unknown): Schedule[] => {
  if (!Array.isArray(schedules)) throw new Error("moments-schedules needs a list of schedules");
  schedules.forEach((s: any, i) => {
    const at = `schedules[${i}]`;
    if (!s || typeof s !== "object") throw new Error(`${at} must be an object`);
    if (!s.name) throw new Error(`${at} needs a name`);
    if (!s.automation) throw new Error(`${at} (${s.name}) needs an automation`);
    if (!s.time_entity && !s.sun) throw new Error(`${at} (${s.name}) needs a time_entity or sun`);
    if (s.sun && s.sun !== "sunrise" && s.sun !== "sunset")
      throw new Error(`${at} (${s.name}): sun must be sunrise or sunset`);
    if (s.days_entities && (!Array.isArray(s.days_entities) || s.days_entities.length !== 7))
      throw new Error(`${at} (${s.name}): days_entities needs 7 entries, Monday first`);
  });
  return schedules as Schedule[];
};
