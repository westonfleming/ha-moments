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
    expect(inferIconSet(ent("cover.g", "open", { device_class: "garage" }))).toBe("garage");
    expect(inferIconSet(ent("cover.d", "open", { device_class: "door" }))).toBe("door");
    expect(inferIconSet(ent("cover.c", "open", { device_class: "curtain" }))).toBe("curtain");
    expect(inferIconSet(ent("cover.s", "open", { device_class: "shutter" }))).toBe("blind");
    expect(inferIconSet(ent("binary_sensor.m", "on", { device_class: "occupancy" }))).toBe("motion");
    expect(inferIconSet(ent("sensor.t", "20", { device_class: "temperature" }))).toBe("temp");
    expect(inferIconSet(ent("sensor.x", "20"))).toBeUndefined();
  });
  it("covers the common HA domains and device classes", () => {
    const cases: [string, Record<string, any>, string][] = [
      ["media_player.tv", { device_class: "tv" }, "tv"],
      ["media_player.kitchen", {}, "speaker"],
      ["vacuum.robot", {}, "vacuum"],
      ["lawn_mower.robot", {}, "mower"],
      ["humidifier.bedroom", {}, "humidifier"],
      ["water_heater.tank", {}, "water_heater"],
      ["valve.main", { device_class: "water" }, "valve"],
      ["alarm_control_panel.home", {}, "alarm"],
      ["camera.porch", {}, "camera"],
      ["siren.hall", {}, "siren"],
      ["person.sam", {}, "person"],
      ["device_tracker.phone", {}, "person"],
      ["update.core", {}, "update"],
      ["binary_sensor.w", { device_class: "window" }, "window"],
      ["binary_sensor.g", { device_class: "garage_door" }, "garage"],
      ["binary_sensor.s", { device_class: "smoke" }, "smoke"],
      ["binary_sensor.c", { device_class: "carbon_monoxide" }, "co"],
      ["binary_sensor.gas", { device_class: "gas" }, "gas"],
      ["binary_sensor.l", { device_class: "moisture" }, "leak"],
      ["binary_sensor.p", { device_class: "tamper" }, "problem"],
      ["binary_sensor.n", { device_class: "connectivity" }, "connectivity"],
      ["binary_sensor.b", { device_class: "battery" }, "battery"],
      ["binary_sensor.r", { device_class: "running" }, "running"],
      ["binary_sensor.v", { device_class: "moving" }, "vibration"],
      ["binary_sensor.so", { device_class: "sound" }, "sound"],
      ["binary_sensor.lk", { device_class: "lock" }, "lock"],
      ["binary_sensor.pw", { device_class: "power" }, "plug"],
      ["binary_sensor.cold", { device_class: "cold" }, "temp"],
      ["sensor.h", { device_class: "humidity" }, "humidity"],
      ["sensor.bat", { device_class: "battery" }, "battery"],
      ["sensor.co2", { device_class: "carbon_dioxide" }, "air"],
      ["sensor.pm", { device_class: "pm25" }, "air"],
    ];
    for (const [id, attrs, set] of cases) expect(inferIconSet(ent(id, "on", attrs)), id).toBe(set);
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
  it("maps the new sets' HA states", () => {
    expect(resolveIconState("tv", ent("media_player.tv", "buffering"))).toBe("playing");
    expect(resolveIconState("speaker", ent("media_player.s", "standby"))).toBe("off");
    expect(resolveIconState("vacuum", ent("vacuum.v", "returning"))).toBe("returning");
    expect(resolveIconState("mower", ent("lawn_mower.m", "docked"))).toBe("docked");
    expect(resolveIconState("garage", ent("cover.g", "opening"))).toBe("opening");
    expect(resolveIconState("curtain", ent("cover.c", "open", { current_position: 40 }))).toBe("partial");
    expect(resolveIconState("alarm", ent("alarm_control_panel.a", "armed_vacation"))).toBe("armed_away");
    expect(resolveIconState("alarm", ent("alarm_control_panel.a", "triggered"))).toBe("triggered");
    expect(resolveIconState("humidifier", ent("humidifier.h", "on", { action: "drying" }))).toBe("drying");
    expect(resolveIconState("water_heater", ent("water_heater.w", "heat_pump"))).toBe("eco");
    expect(resolveIconState("person", ent("person.p", "Work"))).toBe("away");
    expect(resolveIconState("battery", ent("sensor.b", "18", { device_class: "battery" }))).toBe("low");
    expect(resolveIconState("battery", ent("binary_sensor.c", "on", { device_class: "battery_charging" }))).toBe("charging");
    expect(resolveIconState("update", ent("update.u", "on", { in_progress: 40 }))).toBe("installing");
    expect(resolveIconState("lock", ent("binary_sensor.l", "on", { device_class: "lock" }))).toBe("unlocked");
    expect(resolveIconState("temp", ent("binary_sensor.c", "on", { device_class: "cold" }))).toBe("cold");
    expect(resolveIconState("humidity", ent("sensor.h", "72"))).toBe("humid");
    expect(resolveIconState("humidity", ent("sensor.h", "50"), { humid_above: 45 })).toBe("humid");
    expect(resolveIconState("air", ent("sensor.c", "1300", { device_class: "carbon_dioxide" }))).toBe("poor");
    expect(resolveIconState("air", ent("sensor.c", "900", { device_class: "carbon_dioxide" }))).toBe("fair");
    expect(resolveIconState("air", ent("sensor.c", "40", { device_class: "pm25" }), { poor_above: 50 })).toBe("fair");
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
