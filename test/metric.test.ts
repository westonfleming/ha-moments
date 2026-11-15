import { describe, expect, it } from "vitest";
import "../src/ha-moments";
import { DEFAULT_LEVELS, discoverArea, levelFor, presenceText, resample, sparkPath } from "../src/metrics";
import { headerModel, type MomentsAreaHeader } from "../src/cards/moments-area-header";
import type { MomentsMetric } from "../src/cards/moments-metric";
import { fakeHass } from "./fake-hass";

const areaHass = (states: Parameters<typeof fakeHass>[0], area: Record<string, string>) =>
  fakeHass(states, {
    areas: { lounge: { area_id: "lounge", name: "Lounge" } },
    entities: Object.fromEntries(Object.entries(area).map(([id, a]) => [id, { entity_id: id, area_id: a }])) as any,
  });

describe("levels and sparklines", () => {
  it("picks the first level the value is below", () => {
    expect(levelFor(650, DEFAULT_LEVELS.co2)?.label).toBe("Good");
    expect(levelFor(900, DEFAULT_LEVELS.co2)?.label).toBe("Fair");
    expect(levelFor(1500, DEFAULT_LEVELS.co2)?.label).toBe("High");
    expect(levelFor(NaN, DEFAULT_LEVELS.co2)).toBeUndefined();
    expect(levelFor(20, undefined)).toBeUndefined();
  });
  it("resamples a step series and draws a path", () => {
    const pts = [{ t: 0, v: 1 }, { t: 50, v: 3 }];
    expect(resample(pts, 0, 100, 5)).toEqual([1, 1, 3, 3, 3]);
    expect(resample([], 0, 1)).toEqual([]);
    const sp = sparkPath([1, 2, 3])!;
    expect(sp.d.startsWith("M0.0 20.0")).toBe(true);
    expect(sp.end).toEqual([56, 2]);
    expect(sparkPath([1])).toBeUndefined();
  });
});

describe("areas", () => {
  const hass = areaHass(
    {
      "sensor.t": ["21.36", { device_class: "temperature", unit_of_measurement: "°C" }],
      "sensor.h": ["48", { device_class: "humidity" }],
      "sensor.co2": ["1350", { device_class: "carbon_dioxide", unit_of_measurement: "ppm" }],
      "binary_sensor.occ": ["on", { device_class: "occupancy" }],
      "binary_sensor.leak": ["on", { device_class: "moisture", friendly_name: "Sink leak" }],
      "light.a": "on",
      "light.b": "off",
      "light.elsewhere": "on",
    },
    { "sensor.t": "lounge", "sensor.h": "lounge", "sensor.co2": "lounge", "binary_sensor.occ": "lounge", "binary_sensor.leak": "lounge", "light.a": "lounge", "light.b": "lounge", "light.elsewhere": "kitchen" },
  );
  it("finds an area's readings, presence, lights and alerts", () => {
    expect(discoverArea(hass, "lounge")).toEqual({
      temperature: "sensor.t",
      humidity: "sensor.h",
      air: "sensor.co2",
      illuminance: undefined,
      presence: "binary_sensor.occ",
      lights: ["light.a", "light.b"],
      alerts: ["binary_sensor.leak"],
    });
  });
  it("describes presence and how long", () => {
    const now = Date.parse("2026-01-01T12:00:00Z");
    const e = (state: string, at: string) => ({ entity_id: "b.x", state, attributes: {}, last_changed: at });
    expect(presenceText(e("on", "2026-01-01T11:48:00Z"), now)?.text).toBe("Occupied · 12 min");
    expect(presenceText(e("off", "2026-01-01T10:00:00Z"), now)?.text).toBe("Empty · 2 h");
    expect(presenceText(e("unavailable", ""), now)).toBeUndefined();
  });
  it("builds the header with chips, alerts and the light count", () => {
    const m = headerModel(hass, { type: "x", area: "lounge" });
    expect(m.name).toBe("Lounge");
    expect(m.presence?.on).toBe(true);
    expect(m.stats.map((s) => s.text)).toEqual(["21.4°", "48%", "Air high"]);
    expect(m.alerts.map((a) => a.text)).toEqual(["CO₂ high", "Sink leak"]);
    expect([m.lightsOn, m.lights.length]).toEqual([1, 2]);
  });
  it("lets config override, hide and reorder", () => {
    const m = headerModel(hass, { type: "x", area: "lounge", name: "Den", humidity: false, alerts: false, lights: false, show: ["air", "temperature", "humidity"] });
    expect(m.name).toBe("Den");
    expect(m.stats.map((s) => s.stat)).toEqual(["air", "temperature"]);
    expect(m.alerts.map((a) => a.text)).toEqual(["CO₂ high"]);
    expect(m.lights).toEqual([]);
  });
});

describe("cards", () => {
  it("rejects bad config", () => {
    const metric = document.createElement("moments-metric") as MomentsMetric;
    expect(() => metric.setConfig({ type: "x" } as any)).toThrow(/entity/);
    expect(() => metric.setConfig({ type: "x", entity: "sensor.a", sparkline: "day" } as any)).toThrow(/sparkline/);
    expect(() => metric.setConfig({ type: "x", entity: "sensor.a", levels: [{ below: 3 }] } as any)).toThrow(/levels/);
    const header = document.createElement("moments-area-header") as MomentsAreaHeader;
    expect(() => header.setConfig({ type: "x" } as any)).toThrow(/area/);
    expect(() => header.setConfig({ type: "x", area: "a", presence: "nope" } as any)).toThrow(/presence/);
    expect(() => header.setConfig({ type: "x", area: "a", lights: "light.a" } as any)).toThrow(/lights/);
    expect(() => header.setConfig({ type: "x", area: "a", show: ["wind"] } as any)).toThrow(/show/);
  });
  it("metric shows the value and its level", async () => {
    const el = document.createElement("moments-metric") as MomentsMetric;
    el.setConfig({ type: "x", entity: "sensor.co2", sparkline: false } as any);
    el.hass = fakeHass({ "sensor.co2": ["640", { device_class: "carbon_dioxide", unit_of_measurement: "ppm" }] });
    document.body.appendChild(el);
    await el.updateComplete;
    const r = el.shadowRoot!;
    expect(r.querySelector(".label")!.textContent).toContain("CO₂");
    expect(r.querySelector(".value")!.textContent).toBe("640ppm");
    expect(r.querySelector(".status")!.textContent).toBe("Good");
    expect(r.querySelector(".spark")).toBeNull();
    el.remove();
  });
  it("header switch turns all the area's lights off when any are on", async () => {
    const el = document.createElement("moments-area-header") as MomentsAreaHeader;
    el.setConfig({ type: "x", area: "lounge" } as any);
    el.hass = areaHass({ "light.a": "on", "light.b": "off" }, { "light.a": "lounge", "light.b": "lounge" });
    document.body.appendChild(el);
    await el.updateComplete;
    const sw = el.shadowRoot!.querySelector<HTMLElement>(".lights")!;
    expect(sw.textContent).toContain("1 of 2 lights");
    sw.click();
    await new Promise((r) => setTimeout(r));
    expect((el.hass as any).calls).toEqual([["light", "turn_off", { entity_id: ["light.a", "light.b"] }]]);
    el.remove();
  });
});
