// Pure logic behind the appliance card: past runs from an operation-state history.

import { numeric, periodsWhere, valueAt, type Point } from "./data/history";

export const DEFAULT_RUNNING = ["run", "running", "pause", "delayedstart"];
export const DEFAULT_FINISHED = ["finished", "finish", "complete", "completed", "end"];

export interface Run {
  start: number;
  end: number;
  /** Still going at `now`. */
  ongoing: boolean;
  program?: string;
  /** kWh used, from a cumulative energy sensor. */
  kwh?: number;
}

const lower = (states: string[]) => states.map((s) => s.toLowerCase());

/** Runs, newest first. Running stretches less than `mergeGapMs` apart (a pause, a blip) count as one. */
export const runsFrom = (
  status: Point[],
  now: number,
  opts: { running?: string[]; program?: Point[]; energy?: Point[]; mergeGapMs?: number } = {},
): Run[] => {
  const running = lower(opts.running ?? DEFAULT_RUNNING);
  const gap = opts.mergeGapMs ?? 10 * 60_000;
  const merged: { start: number; end: number }[] = [];
  for (const p of periodsWhere(status, (s) => running.includes(s.toLowerCase()), now)) {
    const last = merged[merged.length - 1];
    if (last && p.start - last.end < gap) last.end = p.end;
    else merged.push({ ...p });
  }
  const energy = numeric(opts.energy);
  const energyAt = (t: number) => [...energy].reverse().find((p) => p.t <= t)?.v;
  return merged
    .map((p) => {
      const program = opts.program ? valueAt(opts.program, p.start + 60_000) : undefined;
      const e0 = energyAt(p.start);
      const e1 = energyAt(p.end);
      const kwh = e0 !== undefined && e1 !== undefined && e1 >= e0 ? e1 - e0 : undefined;
      return {
        start: p.start,
        end: p.end,
        ongoing: p.end >= now,
        program: program && !["unknown", "unavailable", ""].includes(program) ? program : undefined,
        kwh,
      };
    })
    .reverse();
};

/** "Eco50" or "dishcare_dishwasher_program_eco_50" → readable words. */
export const programLabel = (raw?: string) => {
  if (!raw) return undefined;
  const tail = raw.split(/[._]program[._]/i).pop() ?? raw;
  const words = tail.replace(/[_.]+/g, " ").replace(/([a-z])(\d)/gi, "$1 $2").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
