// Pure logic behind the weather card.

import { startOfDay } from "./format";

/** One entry of a daily forecast from `weather/subscribe_forecast`. */
export interface ForecastDay {
  datetime: string;
  condition?: string;
  temperature?: number;
  templow?: number;
  precipitation?: number;
  precipitation_probability?: number;
  wind_speed?: number;
  wind_gust_speed?: number;
}

/** Today's forecast (when the provider includes it) and the days after it. */
export const splitForecast = (forecast: ForecastDay[] = [], now = new Date(), days = 7) => {
  const today0 = startOfDay(now).getTime();
  const tomorrow0 = today0 + 24 * 3600_000;
  const dated = forecast.map((f) => ({ f, t: new Date(f.datetime).getTime() })).filter((x) => Number.isFinite(x.t));
  const today = dated.find((x) => x.t >= today0 && x.t < tomorrow0)?.f;
  const upcoming = dated.filter((x) => x.t >= tomorrow0).map((x) => x.f).slice(0, days);
  return { today, upcoming };
};

/** Left offset and width (percent) of a low-to-high bar on a shared scale. */
export const rangeBar = (lo: number, hi: number, min: number, max: number) => {
  const span = max - min || 1;
  const left = Math.max(0, ((lo - min) / span) * 100);
  const width = Math.max(2, ((hi - lo) / span) * 100);
  return { left: Math.min(left, 98), width: Math.min(width, 100 - Math.min(left, 98)) };
};

/** Colour level for a gust speed: "high" at or above `warn`, "mid" from 80% of it. */
export const gustLevel = (gust: number | undefined, warn: number): "high" | "mid" | "" =>
  gust === undefined ? "" : gust >= warn ? "high" : gust >= warn * 0.8 ? "mid" : "";
