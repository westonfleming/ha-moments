// Pure logic behind the temperatures card.

import type { NumericPoint } from "./data/history";

export type Trend = "rising" | "falling" | "steady";

/** Lowest and highest value since `from`, including the value in force at `from` and `current`. */
export const rangeSince = (points: NumericPoint[], from: number, current?: number): [number, number] | undefined => {
  const before = [...points].reverse().find((p) => p.t <= from);
  const values = [...(before ? [before.v] : []), ...points.filter((p) => p.t > from).map((p) => p.v)];
  if (current !== undefined && Number.isFinite(current)) values.push(current);
  return values.length ? [Math.min(...values), Math.max(...values)] : undefined;
};

/** Rising or falling when the value moved more than `threshold` over the last hour. */
export const trend = (points: NumericPoint[], current: number, now: number, threshold = 0.3): Trend => {
  const hourAgo = [...points].reverse().find((p) => p.t <= now - 3600_000);
  if (!hourAgo || !Number.isFinite(current)) return "steady";
  const delta = current - hourAgo.v;
  return delta > threshold ? "rising" : delta < -threshold ? "falling" : "steady";
};
