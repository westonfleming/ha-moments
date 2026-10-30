// Locale-aware formatting shared by the cards.

import type { HomeAssistant } from "./types";

type Locale = HomeAssistant["locale"];

const safeFormat = (lang: string | undefined, opts: Intl.DateTimeFormatOptions, date: Date) => {
  try {
    return new Intl.DateTimeFormat(lang, opts).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, opts).format(date);
  }
};

/** The local time, honouring the HA profile's language and 12/24 hour setting. */
export const formatTime = (date: Date, locale?: Locale): string => {
  const format = locale?.time_format ?? "language";
  const lang = format === "system" ? undefined : locale?.language;
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  if (format === "12") opts.hour12 = true;
  if (format === "24") opts.hourCycle = "h23";
  return safeFormat(lang, opts, date);
};

/** Short weekday, e.g. "Tue". */
export const formatWeekday = (date: Date, locale?: Locale) =>
  safeFormat(locale?.language, { weekday: "short" }, date);

/** Short date, e.g. "Tue 28 Oct". */
export const formatDay = (date: Date, locale?: Locale) =>
  safeFormat(locale?.language, { weekday: "short", day: "numeric", month: "short" }, date).replace(",", "");

/** "45 min", "1 h 05", "3 d 4 h". */
export const formatSpan = (minutes: number) => {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  if (m < 60 * 24) return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
  return `${Math.floor(m / (60 * 24))} d ${Math.floor((m % (60 * 24)) / 60)} h`;
};

/** A number with a fixed number of decimals, or "–" when it isn't one. */
export const formatNumber = (value: unknown, decimals = 0) => {
  const n = typeof value === "number" ? value : Number(value);
  return value === null || value === undefined || value === "" || !Number.isFinite(n) ? "–" : n.toFixed(decimals);
};

/** Local midnight at the start of `date`'s day. */
export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
