// Small helpers for the cards' SVG charts.

import type { ReactiveControllerHost } from "lit";
import type { NumericPoint } from "./data/history";

/** Maps [d0, d1] onto [r0, r1]. */
export const linear = (d0: number, d1: number, r0: number, r1: number) => {
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
};

/** Round tick values covering [min, max] in about `count` steps, keeping the span tight. */
export const niceTicks = (min: number, max: number, count = 3): number[] => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const want = Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10((max - min) / want));
  let best: { lo: number; hi: number; step: number } | undefined;
  for (const m of [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10]) {
    const step = m * mag;
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const steps = Math.round((hi - lo) / step);
    if (steps < want || steps > want + 2) continue;
    if (!best || hi - lo < best.hi - best.lo) best = { lo, hi, step };
  }
  if (!best) return [min, max];
  const ticks: number[] = [];
  for (let v = best.lo; v <= best.hi + best.step * 1e-9; v += best.step) ticks.push(Number(v.toFixed(10)));
  return ticks;
};

/**
 * SVG polyline points for a series whose values hold until the next change.
 * The last value is carried to `until`.
 */
export const linePoints = (
  points: NumericPoint[],
  x: (t: number) => number,
  y: (v: number) => number,
  from: number,
  until: number,
): string => {
  const inside = points.filter((p) => p.t <= until);
  if (!inside.length) return "";
  const before = [...inside].reverse().find((p) => p.t <= from);
  const series = [...(before ? [{ t: from, v: before.v }] : []), ...inside.filter((p) => p.t > from)];
  if (!series.length) return "";
  const last = series[series.length - 1];
  return [...series, { t: until, v: last.v }]
    .map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`)
    .join(" ");
};

/** Min and max of the values, or undefined when there are none. */
export const extent = (values: number[]): [number, number] | undefined => {
  const finite = values.filter(Number.isFinite);
  return finite.length ? [Math.min(...finite), Math.max(...finite)] : undefined;
};

/**
 * Tracks the host's width so a chart can draw at 1:1 scale, keeping its text
 * the same size on a phone and an iPad.
 */
export class WidthController {
  width: number;

  private observer?: ResizeObserver;

  constructor(
    private host: ReactiveControllerHost & HTMLElement,
    fallback = 600,
  ) {
    this.width = fallback;
    host.addController(this);
  }

  hostConnected() {
    if (typeof ResizeObserver === "undefined") return;
    this.observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0 && Math.abs(w - this.width) > 2) {
        this.width = w;
        this.host.requestUpdate();
      }
    });
    this.observer.observe(this.host);
  }

  hostDisconnected() {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  /** Drawing width inside a panel with 20px side padding. */
  inner(min = 260) {
    return Math.max(min, this.width - 40);
  }
}
