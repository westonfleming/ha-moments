// Recorded history from Home Assistant, for charts and logs.

import type { ReactiveControllerHost } from "lit";
import type { HomeAssistant } from "../types";

/** One recorded state: when it began (ms) and the raw state. */
export interface Point {
  t: number;
  v: string;
}

export type History = Record<string, Point[]>;

export interface NumericPoint {
  t: number;
  v: number;
}

export interface Period {
  start: number;
  end: number;
}

/** Rows of `history/history_during_period` with `minimal_response`: state, last updated, last changed (seconds). */
interface CompressedState {
  s: string;
  lu?: number;
  lc?: number;
}

export const parseHistory = (raw: Record<string, CompressedState[]> | null | undefined): History => {
  const out: History = {};
  for (const [id, rows] of Object.entries(raw ?? {})) {
    out[id] = (rows ?? [])
      .map((r) => ({ t: (r.lc ?? r.lu ?? 0) * 1000, v: r.s }))
      .filter((p) => p.t > 0)
      .sort((a, b) => a.t - b.t);
  }
  return out;
};

export const fetchHistory = async (
  hass: HomeAssistant,
  entityIds: string[],
  start: Date,
  end?: Date,
): Promise<History> => {
  if (!hass.callWS || !entityIds.length) return {};
  const raw = await hass.callWS<Record<string, CompressedState[]>>({
    type: "history/history_during_period",
    start_time: start.toISOString(),
    ...(end ? { end_time: end.toISOString() } : {}),
    entity_ids: entityIds,
    minimal_response: true,
    no_attributes: true,
    significant_changes_only: false,
  });
  return parseHistory(raw);
};

/** Numeric states only; "unavailable" and the like are dropped. */
export const numeric = (points: Point[] = []): NumericPoint[] =>
  points
    .filter((p) => p.v !== "" && p.v !== null)
    .map((p) => ({ t: p.t, v: Number(p.v) }))
    .filter((p) => Number.isFinite(p.v));

/** The state in force at time `t`, or undefined before the first point. */
export const valueAt = (points: Point[] = [], t: number): string | undefined => {
  let value: string | undefined;
  for (const p of points) {
    if (p.t > t) break;
    value = p.v;
  }
  return value;
};

/** Stretches of time where `test(state)` holds, oldest first; one still going ends at `now`. */
export const periodsWhere = (points: Point[] = [], test: (state: string) => boolean, now: number): Period[] => {
  const out: Period[] = [];
  let open: number | undefined;
  for (const p of points) {
    const hit = test(p.v);
    if (hit && open === undefined) open = p.t;
    if (!hit && open !== undefined) {
      out.push({ start: open, end: p.t });
      open = undefined;
    }
  }
  if (open !== undefined) out.push({ start: open, end: now });
  return out;
};

/**
 * Loads history for a card and refreshes it every few minutes.
 * Call `load` from `updated()`; the host re-renders when data arrives.
 */
export class HistoryLoader {
  data: History = {};
  failed = false;
  private key = "";
  private at = 0;
  private busy = false;

  constructor(
    private host: ReactiveControllerHost,
    private refreshMs = 5 * 60_000,
  ) {}

  load(hass: HomeAssistant | undefined, entityIds: string[], start: Date) {
    if (!hass?.callWS || !entityIds.length || this.busy) return;
    const key = `${entityIds.join(",")}|${start.toDateString()}`;
    if (key === this.key && Date.now() - this.at < this.refreshMs) return;
    this.key = key;
    this.at = Date.now();
    this.busy = true;
    fetchHistory(hass, entityIds, start)
      .then((data) => {
        this.data = data;
        this.failed = false;
      })
      .catch(() => {
        this.failed = true;
      })
      .finally(() => {
        this.busy = false;
        this.host.requestUpdate();
      });
  }
}
