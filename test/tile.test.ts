import { describe, expect, it } from "vitest";
import "../src/ha-moments";
import { MomentsTile, progressOf, stateLine } from "../src/cards/moments-tile";
import { blindStep, inferIconSet, resolveIconState, tintFor } from "../src/icons/resolve";
import { ICONS, ICON_SETS } from "../src/icons/generated";
import { fakeHass } from "./fake-hass";

const ent = (entity_id: string, state: string, attributes: Record<string, any> = {}) => ({
  entity_id,
  state,
  attributes,
  last_changed: "",
});

describe("icons", () => {
  it("has every state of every set in both styles", () => {
    for (const style of ["glow", "crisp"] as const)
      for (const [set, states] of Object.entries(ICON_SETS))
        for (const s of states) expect(ICONS[style][`${set}/${s}`], `${style} ${set}/${s}`).toMatch(/^<svg /);
  });
  it("has a blind icon for every 10% step", () => {
    for (let p = 0; p <= 100; p += 10) expect(ICON_SETS.blind).toContain(String(p));
  });
});

describe("inferIconSet", () => {
  it("picks a set from domain and device class", () => {
    expect(inferIconSet(ent("light.a", "on"))).toBe("light");
    expect(inferIconSet(ent("cover.a", "open", { device_class: "blind" }))).toBe("blind");
    expect(inferIconSet(ent("cover.g", "open", { device_class: "garage" }))).toBe("door");
    expect(inferIconSet(ent("binary_sensor.m", "on", { device_class: "occupancy" }))).toBe("motion");
    expect(inferIconSet(ent("sensor.t", "20", { device_class: "temperature" }))).toBe("temp");
    expect(inferIconSet(ent("sensor.x", "20"))).toBeUndefined();
  });
});

describe("resolveIconState", () => {
  it("dims lights at 40% brightness or less", () => {
    expect(resolveIconState("light", ent("light.a", "on", { brightness: 255 }))).toBe("on");
    expect(resolveIconState("light", ent("light.a", "on", { brightness: 90 }))).toBe("dim");
    expect(resolveIconState("light", ent("light.a", "off"))).toBe("off");
  });
  it("rounds blind positions up to the next 10% step", () => {
    expect(blindStep(0)).toBe(0);
    expect(blindStep(1)).toBe(10);
    expect(blindStep(10)).toBe(10);
    expect(blindStep(37)).toBe(40);
    expect(resolveIconState("blind", ent("cover.b", "open", { current_position: 73 }))).toBe("80");
    expect(resolveIconState("blind", ent("cover.b", "opening"))).toBe("opening");
    expect(resolveIconState("blind", ent("cover.b", "closed"))).toBe("0");
  });
  it("follows the thermostat's action over its mode", () => {
    expect(resolveIconState("thermostat", ent("climate.a", "heat", { hvac_action: "idle" }))).toBe("idle");
    expect(resolveIconState("thermostat", ent("climate.a", "heat", { hvac_action: "heating" }))).toBe("heat");
    expect(resolveIconState("thermostat", ent("climate.a", "off"))).toBe("off");
  });
  it("lets a states map translate an appliance's own words", () => {
    const states = { running: ["Run", "DelayedStart"], on: ["Ready"] };
    expect(resolveIconState("dishwasher", ent("sensor.dw", "Run"), { states })).toBe("running");
    expect(resolveIconState("dishwasher", ent("sensor.dw", "Ready"), { states })).toBe("on");
    expect(resolveIconState("dishwasher", ent("sensor.dw", "inactive"), { states })).toBe("off");
  });
  it("uses thresholds for light and temperature sensors", () => {
    expect(resolveIconState("lux", ent("sensor.l", "20"))).toBe("dark");
    expect(resolveIconState("lux", ent("sensor.l", "300"))).toBe("dim");
    expect(resolveIconState("lux", ent("sensor.l", "300"), { bright_above: 200 })).toBe("bright");
    expect(resolveIconState("temp", ent("sensor.t", "3"))).toBe("cold");
    expect(resolveIconState("temp", ent("sensor.t", "21"))).toBe("comfortable");
  });
  it("falls back to a resting state when the entity is missing", () => {
    expect(resolveIconState("plug", undefined)).toBe("off");
  });
  it("tints only active states", () => {
    expect(tintFor("light", "off")).toBeUndefined();
    expect(tintFor("blind", "0")).toBeUndefined();
    expect(tintFor("blind", "40")).toBeDefined();
  });
});

describe("state line and progress", () => {
  const hass = fakeHass({
    "light.k": ["on", { brightness: 204 }],
    "sensor.dw": "Run",
    "sensor.prog": "Eco 50",
    "sensor.pct": "64",
    "sensor.end": "2026-01-01T01:42:00",
    "sensor.power": ["412", { unit_of_measurement: "W" }],
    "sensor.gone": "unavailable",
    "cover.b": ["open", { current_position: 40 }],
  });
  it("adds brightness, secondary and metrics, skipping unavailable ones", () => {
    expect(stateLine(hass, { type: "x", entity: "light.k" }, hass.states["light.k"])).toEqual(["On · 80%"]);
    const c = { type: "x", entity: "sensor.dw", secondary: "sensor.prog", metrics: ["sensor.power", "sensor.gone"] };
    expect(stateLine(hass, c, hass.states["sensor.dw"])).toEqual(["Run", "Eco 50", "412 W"]);
  });
  it("draws progress only when configured and in range", () => {
    expect(progressOf(hass, { type: "x", entity: "sensor.dw" }, hass.states["sensor.dw"])).toBeUndefined();
    const p = progressOf(hass, { type: "x", entity: "sensor.dw", progress: "sensor.pct", finish: "sensor.end" }, hass.states["sensor.dw"], { language: "en-GB", time_format: "24" });
    expect(p?.value).toBe(0.64);
    expect(p?.finish).toMatch(/^0?1:42$/);
    expect(progressOf(hass, { type: "x", entity: "cover.b", progress: "position" }, hass.states["cover.b"])?.value).toBe(0.4);
  });
});

describe("moments-tile", () => {
  const make = (config: Record<string, any>, states: Parameters<typeof fakeHass>[0]) => {
    const el = document.createElement("moments-tile") as MomentsTile;
    el.setConfig({ type: "custom:moments-tile", ...config } as any);
    el.hass = fakeHass(states);
    document.body.appendChild(el);
    return el;
  };
  it("rejects bad config", () => {
    const el = document.createElement("moments-tile") as MomentsTile;
    expect(() => el.setConfig({ type: "x" } as any)).toThrow(/entity/);
    expect(() => el.setConfig({ type: "x", entity: "light.a", icon_set: "toaster" } as any)).toThrow(/icon_set/);
    expect(() => el.setConfig({ type: "x", entity: "light.a", surface: "chrome" } as any)).toThrow(/surface/);
    expect(() => el.setConfig({ type: "x", entity: "light.a", opacity: 2 } as any)).toThrow(/opacity/);
    expect(() => el.setConfig({ type: "x", entity: "light.a", progress: "half" } as any)).toThrow(/progress/);
  });
  it("draws the icon for the current state and the surface class", async () => {
    const el = make({ entity: "light.k", surface: "glass", opacity: 0.3 }, { "light.k": ["on", { brightness: 255 }] });
    await el.updateComplete;
    const card = el.shadowRoot!.querySelector("ha-card")!;
    expect(card.className).toContain("glass");
    expect(card.getAttribute("style")).toContain("--moments-surface-opacity:30%");
    expect(el.shadowRoot!.querySelector("#icon svg")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".state")!.textContent).toBe("On · 100%");
    el.remove();
  });
  it("keeps the blind icon and glides its shade between steps", async () => {
    const el = make({ entity: "cover.b" }, { "cover.b": ["open", { current_position: 20, device_class: "blind" }] });
    await el.updateComplete;
    const svg = el.shadowRoot!.querySelector("#icon svg");
    el.hass = fakeHass({ "cover.b": ["open", { current_position: 70, device_class: "blind" }] });
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("#icon svg")).toBe(svg);
    const shade = el.shadowRoot!.querySelector<SVGGElement>(".hm-shade")!;
    expect(shade.style.transform).toContain("scaleY(0.384)");
    el.remove();
  });
  it("toggles on tap when asked", async () => {
    const el = make({ entity: "switch.p", tap_action: "toggle" }, { "switch.p": "off" });
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLElement>("ha-card")!.click();
    await new Promise((r) => setTimeout(r));
    expect((el.hass as any).calls).toEqual([["homeassistant", "toggle", { entity_id: "switch.p" }]]);
    el.remove();
  });
});
