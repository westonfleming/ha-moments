import { describe, expect, it } from "vitest";
import "../src/ha-moments";
import { numeric, parseHistory, periodsWhere, valueAt } from "../src/data/history";
import { linePoints, linear, niceTicks } from "../src/charts";
import { formatSpan } from "../src/format";
import { gustLevel, rangeBar, splitForecast } from "../src/weather";
import { rangeSince, trend } from "../src/climate";
import { crossings, darkPeriods } from "../src/cards/moments-daylight";
import { outages } from "../src/cards/moments-internet";
import { programLabel, runsFrom } from "../src/appliance";
import { fakeHass } from "./fake-hass";

const H = 3600_000;
const p = (t: number, v: string | number) => ({ t, v: String(v) });
const n = (t: number, v: number) => ({ t, v });

describe("history", () => {
  it("parses compressed rows, using last changed when given", () => {
    const h = parseHistory({ "sensor.a": [{ s: "2", lu: 20 }, { s: "1", lu: 15, lc: 10 }] });
    expect(h["sensor.a"]).toEqual([p(10_000, 1), p(20_000, 2)]);
  });
  it("keeps numeric states only", () => {
    expect(numeric([p(1, "3.5"), p(2, "unavailable"), p(3, "")])).toEqual([n(1, 3.5)]);
  });
  it("finds the value in force at a time", () => {
    const pts = [p(10, "a"), p(20, "b")];
    expect(valueAt(pts, 5)).toBeUndefined();
    expect(valueAt(pts, 15)).toBe("a");
    expect(valueAt(pts, 20)).toBe("b");
  });
  it("finds periods, closing an open one at now", () => {
    const pts = [p(0, "on"), p(10, "off"), p(15, "on"), p(30, "off")];
    expect(periodsWhere(pts, (s) => s === "off", 40)).toEqual([
      { start: 10, end: 15 },
      { start: 30, end: 40 },
    ]);
  });
});

describe("charts", () => {
  it("maps linearly and survives an empty domain", () => {
    expect(linear(0, 10, 0, 100)(5)).toBe(50);
    expect(Number.isFinite(linear(3, 3, 0, 100)(3))).toBe(true);
  });
  it("picks round ticks covering the range", () => {
    expect(niceTicks(0, 512, 2)).toEqual([0, 200, 400, 600]);
    expect(niceTicks(16, 22, 3)).toEqual([16, 18, 20, 22]);
  });
  it("carries the value in force at the start and to the end", () => {
    const pts = linePoints([n(0, 1), n(50, 2)], (t) => t, (v) => v, 10, 100);
    expect(pts).toBe("10.0,1.0 50.0,2.0 100.0,2.0");
  });
});

describe("formatSpan", () => {
  it("uses minutes, hours and days", () => {
    expect(formatSpan(45)).toBe("45 min");
    expect(formatSpan(65)).toBe("1 h 05");
    expect(formatSpan(60 * 24 * 2 + 60 * 16)).toBe("2 d 16 h");
  });
});

describe("weather", () => {
  const now = new Date(2026, 9, 30, 19, 42);
  const day = (d: number) => new Date(2026, 9, d, 12).toISOString();
  const forecast = [30, 31, 1, 2].map((d, i) => ({ datetime: i < 2 ? day(d) : new Date(2026, 10, d, 12).toISOString(), temperature: 10 + i }));
  it("splits today from the days after it", () => {
    const { today, upcoming } = splitForecast(forecast, now, 2);
    expect(today?.temperature).toBe(10);
    expect(upcoming.map((f) => f.temperature)).toEqual([11, 12]);
  });
  it("places a range bar on a shared scale", () => {
    expect(rangeBar(7, 13, 4, 18)).toEqual({ left: (3 / 14) * 100, width: (6 / 14) * 100 });
  });
  it("rates gusts against the warning level", () => {
    expect(gustLevel(58, 50)).toBe("high");
    expect(gustLevel(41, 50)).toBe("mid");
    expect(gustLevel(20, 50)).toBe("");
    expect(gustLevel(undefined, 50)).toBe("");
  });
});

describe("temperatures", () => {
  it("takes today's range from the value at midnight, later values and now", () => {
    expect(rangeSince([n(0, 15), n(10, 18), n(20, 17)], 5, 19)).toEqual([15, 19]);
  });
  it("calls a trend from the value an hour ago", () => {
    const now = 10 * H;
    expect(trend([n(now - 2 * H, 20)], 21, now)).toBe("rising");
    expect(trend([n(now - 2 * H, 20)], 19.5, now)).toBe("falling");
    expect(trend([n(now - 2 * H, 20)], 20.2, now)).toBe("steady");
    expect(trend([], 20, now)).toBe("steady");
  });
});

describe("daylight", () => {
  const pts = [n(0, 0.5), n(7 * H, 80), n(12 * H, 15000), n(17.7 * H, 40), n(19 * H, 1)];
  it("finds crossings of the dark line", () => {
    expect(crossings(pts, 50)).toEqual([
      { t: 7 * H, dark: false },
      { t: 17.7 * H, dark: true },
    ]);
  });
  it("finds dark stretches up to now", () => {
    expect(darkPeriods(pts, 50, 0, 20 * H)).toEqual([
      { start: 0, end: 7 * H },
      { start: 17.7 * H, end: 20 * H },
    ]);
  });
});

describe("internet", () => {
  it("lists outages newest first, ignoring unavailable", () => {
    const pts = [p(0, "on"), p(10, "off"), p(17, "on"), p(30, "unavailable"), p(40, "on"), p(50, "off")];
    expect(outages(pts, 60)).toEqual([
      { start: 50, end: 60 },
      { start: 10, end: 17 },
    ]);
  });
});

describe("appliance", () => {
  const status = [p(0, "ready"), p(10 * H, "run"), p(11 * H, "pause"), p(11.1 * H, "run"), p(13 * H, "finished"), p(20 * H, "run")];
  it("merges pauses into one run and marks a run still going", () => {
    const runs = runsFrom(status, 21 * H, {
      program: [p(0, "dishcare_dishwasher_program_eco_50")],
      energy: [p(9 * H, 100), p(13 * H, 100.85), p(21 * H, 101)],
    });
    expect(runs).toHaveLength(2);
    expect(runs[0]).toMatchObject({ start: 20 * H, ongoing: true });
    expect(runs[1]).toMatchObject({ start: 10 * H, end: 13 * H, ongoing: false, program: "dishcare_dishwasher_program_eco_50" });
    expect(runs[1].kwh).toBeCloseTo(0.85);
  });
  it("turns program ids into words", () => {
    expect(programLabel("dishcare_dishwasher_program_eco_50")).toBe("Eco 50");
    expect(programLabel("Quick45")).toBe("Quick 45");
    expect(programLabel(undefined)).toBeUndefined();
  });
});

const mount = async (tag: string, config: any, hass: any) => {
  const el = document.createElement(tag) as any;
  el.setConfig({ type: `custom:${tag}`, ...config });
  el.hass = hass;
  document.body.append(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
};

describe("cards", () => {
  it("weather subscribes to the daily forecast and lists the days", async () => {
    const sent: any[] = [];
    const now = new Date();
    const days = [0, 1, 2].map((i) => ({
      datetime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12).toISOString(),
      condition: i === 2 ? "lightning-rainy" : "rainy",
      temperature: 12 + i,
      templow: 6,
      precipitation: 4.2,
      wind_speed: 20,
      wind_gust_speed: 58,
    }));
    const hass = fakeHass(
      { "weather.home": ["partlycloudy", { temperature: 14, wind_speed: 12, precipitation_unit: "mm", wind_speed_unit: "km/h" }] },
      {
        connection: {
          subscribeMessage: async (cb: any, msg: any) => {
            sent.push(msg);
            cb({ type: "daily", forecast: days });
            return () => {};
          },
        },
      },
    );
    const el = await mount("moments-weather", { entity: "weather.home" }, hass);
    expect(sent[0]).toEqual({ type: "weather/subscribe_forecast", forecast_type: "daily", entity_id: "weather.home" });
    const text = el.shadowRoot.textContent.replace(/\s+/g, " ");
    expect(text).toContain("Partly cloudy");
    expect(text).toContain("High 12°");
    expect(el.shadowRoot.querySelectorAll(".day.row")).toHaveLength(2);
    expect(el.shadowRoot.querySelector(".day.row .high")?.textContent).toContain("58");
    el.remove();
  });

  it("internet shows status, speeds and outages from history", async () => {
    const now = Date.now() / 1000;
    const hass = fakeHass(
      {
        "binary_sensor.internet": "on",
        "sensor.speedtest_download": ["512", { unit_of_measurement: "Mbit/s" }],
      },
      {
        callWS: async (msg: any) => {
          expect(msg.type).toBe("history/history_during_period");
          return {
            "binary_sensor.internet": [
              { s: "on", lu: now - 7200 },
              { s: "off", lu: now - 3600 },
              { s: "on", lu: now - 3180 },
            ],
            "sensor.speedtest_download": [{ s: "500", lu: now - 7200 }],
          };
        },
      } as any,
    );
    const el = await mount("moments-internet", { online: "binary_sensor.internet", download: "sensor.speedtest_download" }, hass);
    const text = el.shadowRoot.textContent.replace(/\s+/g, " ");
    expect(text).toContain("Online");
    expect(text).toContain("512");
    expect(text).toContain("7 min");
    el.remove();
  });

  it("appliance shows progress while running", async () => {
    const finish = new Date(Date.now() + 88 * 60_000).toISOString();
    const hass = fakeHass(
      {
        "sensor.dw_state": "run",
        "sensor.dw_progress": "64",
        "sensor.dw_finish": finish,
        "select.dw_program": "dishcare_dishwasher_program_eco_50",
      },
      { callWS: async () => ({}) } as any,
    );
    const el = await mount(
      "moments-appliance",
      { name: "Dishwasher", status: "sensor.dw_state", progress: "sensor.dw_progress", finish_time: "sensor.dw_finish", program: "select.dw_program" },
      hass,
    );
    const text = el.shadowRoot.textContent.replace(/\s+/g, " ");
    expect(text).toContain("Run · Eco 50");
    expect(text).toContain("64%");
    expect(text).toMatch(/1 h 2\d left/);
    el.remove();
  });

  it("rejects bad configs with a readable message", () => {
    const el = document.createElement("moments-weather") as any;
    expect(() => el.setConfig({ type: "custom:moments-weather", entity: "sensor.x" })).toThrow(/weather\.\* entity/);
    const t = document.createElement("moments-temperatures") as any;
    expect(() => t.setConfig({ type: "custom:moments-temperatures" })).toThrow(/outside or rooms/);
  });
});
