import { describe, expect, it } from "vitest";
import { chipsFor, formatDuration, groupOnNow, onNowFor } from "../src/exceptions";
import { fakeHass } from "./fake-hass";

const now = new Date("2026-10-26T20:00:00Z");
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();

describe("formatDuration", () => {
  it("uses minutes, hours, then days", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(12.7)).toBe("12 min");
    expect(formatDuration(59)).toBe("59 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(3 * 60 + 40)).toBe("3 h");
    expect(formatDuration(24 * 60 - 1)).toBe("23 h");
    expect(formatDuration(2 * 24 * 60 + 5)).toBe("2 d");
    expect(formatDuration(-5)).toBe("0 min");
  });
});

describe("chipsFor", () => {
  const hass = fakeHass({
    "binary_sensor.front_door": ["on", { device_class: "door", friendly_name: "Front door" }],
    "binary_sensor.back_door": ["off", { device_class: "door", friendly_name: "Back door" }],
    "binary_sensor.leak": ["on", { device_class: "moisture", friendly_name: "Leak" }],
    "binary_sensor.motion": ["on", { device_class: "motion" }],
    "binary_sensor.lost": ["unavailable", { device_class: "door" }],
    "sensor.remote_battery": ["9", { device_class: "battery", friendly_name: "Remote" }],
    "sensor.lock_battery": ["80", { device_class: "battery", friendly_name: "Lock" }],
    "sensor.gone_battery": ["unknown", { device_class: "battery" }],
    "sensor.washer": ["finished", { friendly_name: "Washer" }],
    "sensor.dryer": ["running", { friendly_name: "Dryer" }],
    "automation.wake": "off",
    "automation.bed": "on",
    "automation.porch": "off",
  });
  hass.states["binary_sensor.front_door"].last_changed = ago(12);
  hass.states["automation.wake"].last_changed = ago(30 * 60);
  hass.states["automation.porch"].last_changed = ago(60);

  const schedules = [
    { name: "Wake", automation: "automation.wake" },
    { name: "Bedtime", automation: "automation.bed" },
    { name: "Porch", automation: "automation.porch" },
  ];

  it("reports openings with a duration, hazards and low batteries, alerts first", () => {
    expect(chipsFor(hass, {}, now)).toEqual([
      { entityId: "binary_sensor.front_door", label: "Front door open 12 min", severity: "alert" },
      { entityId: "binary_sensor.leak", label: "Leak", severity: "alert" },
      { entityId: "sensor.remote_battery", label: "Remote 9%", severity: "warn" },
    ]);
  });

  it("formats long openings in hours", () => {
    const h = fakeHass({ "binary_sensor.gate": ["on", { device_class: "opening", friendly_name: "Gate" }] });
    h.states["binary_sensor.gate"].last_changed = ago(185);
    expect(chipsFor(h, {}, now)[0].label).toBe("Gate open 3 h");
  });

  it("honours exclude and the battery threshold", () => {
    const labels = chipsFor(hass, { exclude: ["binary_sensor.leak"], battery_threshold: 90 }, now).map((c) => c.label);
    expect(labels).toEqual(["Front door open 12 min", "Remote 9%", "Lock 80%"]);
  });

  it("adds quiet finished chips when the state matches", () => {
    const chips = chipsFor(
      hass,
      {
        finished: [
          { entity: "sensor.washer", state: "finished" },
          { entity: "sensor.dryer", state: "finished" },
          { entity: "sensor.missing", state: "finished" },
        ],
      },
      now,
    );
    expect(chips.at(-1)).toEqual({ entityId: "sensor.washer", label: "Washer finished", severity: "info" });
    expect(chips.filter((c) => c.severity === "info")).toHaveLength(1);
  });

  it("uses the finished name override", () => {
    const chips = chipsFor(hass, { finished: [{ entity: "sensor.washer", state: "finished", name: "Laundry" }] }, now);
    expect(chips.map((c) => c.label)).toContain("Laundry finished");
  });

  it("only flags schedules off longer than the opt-in threshold", () => {
    expect(chipsFor(hass, { schedules }, now).some((c) => c.label.includes("schedule"))).toBe(false);
    const chips = chipsFor(hass, { schedules, schedules_off_after_hours: 24 }, now).filter((c) => c.severity === "info");
    expect(chips).toEqual([{ entityId: "automation.wake", label: "Wake schedule off", severity: "info" }]);
  });
});

describe("onNowFor", () => {
  const hass = fakeHass(
    {
      "light.lounge": ["on", { friendly_name: "Lounge lamps" }],
      "light.porch": ["on", { friendly_name: "Porch" }],
      "light.off": ["off", { friendly_name: "Off lamp" }],
      "light.hidden": ["on", { friendly_name: "Hidden" }],
      "switch.kettle": ["on", { friendly_name: "Kettle" }],
      "switch.stray": ["on", { friendly_name: "Stray switch" }],
      "cover.blind": ["open", { friendly_name: "Blind" }],
      "fan.desk": ["on", { friendly_name: "Desk fan" }],
    },
    {
      entities: {
        "light.lounge": { entity_id: "light.lounge", area_id: "living" },
        "light.porch": { entity_id: "light.porch", device_id: "dev1" },
        "light.hidden": { entity_id: "light.hidden", hidden: true },
        "switch.kettle": { entity_id: "switch.kettle", area_id: "kitchen" },
        "cover.blind": { entity_id: "cover.blind", area_id: "living" },
      },
      devices: { dev1: { id: "dev1", area_id: "porch" } },
      areas: {
        living: { area_id: "living", name: "Living room" },
        kitchen: { area_id: "kitchen", name: "Kitchen" },
        porch: { area_id: "porch", name: "Front porch" },
      },
    },
  );

  it("lists on entities with area names, leaving out arealess switches", () => {
    const items = onNowFor(hass);
    expect(items.map((i) => [i.name, i.label])).toEqual([
      ["Blind", "Living room"],
      ["Desk fan", undefined],
      ["Kettle", "Kitchen"],
      ["Lounge lamps", "Living room"],
      ["Porch", "Front porch"],
    ]);
  });

  it("includes arealess switches when switch is listed explicitly", () => {
    const names = onNowFor(hass, { domains: ["switch"] }).map((i) => i.name);
    expect(names).toEqual(["Kettle", "Stray switch"]);
  });

  it("labels show_on_now groups with the group name", () => {
    const groups = [
      { name: "Outside", areas: ["porch"], show_on_now: true },
      { name: "Downstairs", areas: ["living", "kitchen"] },
    ];
    const porch = onNowFor(hass, { groups }).find((i) => i.entityId === "light.porch")!;
    expect(porch.label).toBe("Outside");
    expect(porch.areaName).toBe("Front porch");
    expect(onNowFor(hass, { groups }).find((i) => i.entityId === "light.lounge")!.label).toBe("Living room");
  });

  it("honours exclude", () => {
    expect(onNowFor(hass, { exclude: ["light.lounge"] }).some((i) => i.entityId === "light.lounge")).toBe(false);
  });

  it("groups by label with unlabelled items last", () => {
    const groups = groupOnNow(onNowFor(hass));
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([
      ["Front porch", 1],
      ["Kitchen", 1],
      ["Living room", 2],
      [undefined, 1],
    ]);
  });
});
