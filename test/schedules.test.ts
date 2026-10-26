import { describe, expect, it } from "vitest";
import {
  activeDays,
  dayLabel,
  formatNext,
  nextRun,
  scheduleTime,
  summaryText,
  validateSchedules,
  visibleSchedules,
} from "../src/schedules";
import type { Schedule } from "../src/config";
import { MomentsSchedules } from "../src/cards/moments-schedules";
import { fakeHass } from "./fake-hass";

// 2026-10-26 is a Monday.
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m);
const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => `input_boolean.wake_${d}`);
const dayStates = (on: string[]) => Object.fromEntries(days.map((e, i) => [e, on.includes(e.slice(-3)) ? "on" : "off"]));
const weekdays = ["mon", "tue", "wed", "thu", "fri"];

const wake: Schedule = {
  name: "Wake up",
  automation: "automation.wake",
  time_entity: "input_datetime.wake",
  days_entities: days,
};
const lights: Schedule = {
  name: "Porch light",
  automation: "automation.porch",
  sun: "sunset",
  offset_entity: "input_number.porch_offset",
  area: "porch",
};

const hass = (extra: Record<string, string | [string, Record<string, any>]> = {}) =>
  fakeHass({
    "automation.wake": "on",
    "automation.porch": "on",
    "input_datetime.wake": "07:00:00",
    "input_number.porch_offset": "15",
    "sun.sun": [
      "above_horizon",
      { next_rising: at(27, 7, 41).toISOString(), next_setting: at(26, 17, 50).toISOString() },
    ],
    ...dayStates(weekdays),
    ...extra,
  });

describe("scheduleTime", () => {
  it("reads the input_datetime", () => {
    expect(scheduleTime(hass(), wake)).toBe("07:00");
    expect(scheduleTime(hass({ "input_datetime.wake": "6:30:00" }), wake)).toBe("06:30");
    expect(scheduleTime(hass({ "input_datetime.wake": "unknown" }), wake)).toBeUndefined();
  });
  it("adds the sunset offset, across the hour", () => {
    expect(scheduleTime(hass(), lights)).toBe("18:05");
    expect(scheduleTime(hass({ "input_number.porch_offset": "-20" }), lights)).toBe("17:30");
  });
  it("uses sunrise and no offset", () => {
    expect(scheduleTime(hass(), { name: "Blinds", automation: "automation.b", sun: "sunrise" })).toBe("07:41");
  });
});

describe("activeDays and dayLabel", () => {
  it("reads the day helpers Monday first", () => {
    expect(activeDays(hass(), wake)).toEqual([true, true, true, true, true, false, false]);
  });
  it("is every day without helpers", () => {
    expect(activeDays(hass(), lights).every(Boolean)).toBe(true);
  });
  it("labels common sets", () => {
    const d = (s: string) => [...s].map((c) => c === "1");
    expect(dayLabel(d("1111111"))).toBe("Every day");
    expect(dayLabel(d("1111100"))).toBe("Weekdays");
    expect(dayLabel(d("0000011"))).toBe("Weekends");
    expect(dayLabel(d("1010100"))).toBe("Mon, Wed, Fri");
    expect(dayLabel(d("0000000"))).toBe("No days");
  });
});

describe("nextRun", () => {
  it("is later today when still ahead", () => {
    expect(nextRun(hass(), wake, at(26, 6, 0))).toEqual(at(26, 7, 0));
  });
  it("is tomorrow once passed", () => {
    expect(nextRun(hass(), wake, at(26, 7, 0))).toEqual(at(27, 7, 0));
  });
  it("wraps from the weekend to Monday", () => {
    expect(nextRun(hass(), wake, at(30, 8, 0))).toEqual(new Date(2026, 10, 2, 7, 0));
  });
  it("wraps a full week to the same weekday", () => {
    const h = hass(dayStates(["mon"]));
    expect(nextRun(h, wake, at(26, 8, 0))).toEqual(new Date(2026, 10, 2, 7, 0));
  });
  it("is undefined when off or without days", () => {
    expect(nextRun(hass({ "automation.wake": "off" }), wake, at(26, 6))).toBeUndefined();
    expect(nextRun(hass(dayStates([])), wake, at(26, 6))).toBeUndefined();
  });
  it("uses the sunset offset time", () => {
    expect(nextRun(hass(), lights, at(26, 12))).toEqual(at(26, 18, 5));
    expect(nextRun(hass(), lights, at(26, 19))).toEqual(at(27, 18, 5));
  });
});

describe("formatNext", () => {
  it("says today, tomorrow or the weekday", () => {
    const now = at(26, 6);
    expect(formatNext(at(26, 7), now)).toBe("today 07:00");
    expect(formatNext(at(27, 7), now)).toBe("tomorrow 07:00");
    expect(formatNext(at(29, 7), now)).toBe("Thu 07:00");
  });
});

describe("visibleSchedules", () => {
  const office: Schedule = { ...wake, name: "Office", automation: "automation.office", area: "office" };
  const all = [wake, lights, office];
  const h = hass({ "automation.office": "on" });
  it("shows house-level schedules without an area", () => {
    expect(visibleSchedules(h, all, {}).map((s) => s.name)).toEqual(["Wake up"]);
  });
  it("filters to an area", () => {
    expect(visibleSchedules(h, all, { area: "porch" }).map((s) => s.name)).toEqual(["Porch light"]);
  });
  it("shows everything with all, soonest first and off last", () => {
    const now = at(26, 12);
    expect(visibleSchedules(h, all, { all: true }, now).map((s) => s.name)).toEqual(["Porch light", "Wake up", "Office"]);
    const off = hass({ "automation.porch": "off", "automation.office": "on" });
    expect(visibleSchedules(off, all, { all: true }, now).map((s) => s.name)).toEqual(["Wake up", "Office", "Porch light"]);
  });
});

describe("summaryText", () => {
  it("counts and gives the next time", () => {
    expect(summaryText(hass(), [wake, lights], at(26, 12))).toBe("2 schedules · next 18:05");
    expect(summaryText(hass({ "automation.wake": "off" }), [wake], at(26, 12))).toBe("1 schedule · all off");
  });
});

describe("config", () => {
  it("validates schedules", () => {
    expect(() => validateSchedules(undefined)).toThrow(/list of schedules/);
    expect(() => validateSchedules([{ automation: "automation.x", sun: "sunset" }])).toThrow(/name/);
    expect(() => validateSchedules([{ name: "X", sun: "sunset" }])).toThrow(/automation/);
    expect(() => validateSchedules([{ name: "X", automation: "automation.x" }])).toThrow(/time_entity or sun/);
    expect(validateSchedules([wake, lights])).toHaveLength(2);
  });
  it("accepts the stub config and renders a hint", async () => {
    const card = document.createElement("moments-schedules") as MomentsSchedules;
    card.setConfig({ type: "custom:moments-schedules", ...MomentsSchedules.getStubConfig() });
    card.hass = hass();
    document.body.append(card);
    await card.updateComplete;
    expect(card.shadowRoot!.textContent).toContain("Add schedules in the card config");
    card.remove();
  });
  it("toggles the automation and writes the time helper", async () => {
    const h = hass();
    const card = document.createElement("moments-schedules") as MomentsSchedules;
    card.setConfig({ type: "custom:moments-schedules", schedules: [wake] });
    card.hass = h;
    document.body.append(card);
    await card.updateComplete;
    const root = card.shadowRoot!;
    (root.querySelector(".switch") as HTMLElement).click();
    (root.querySelector(".main") as HTMLElement).click();
    await card.updateComplete;
    const input = root.querySelector("input[type=time]") as HTMLInputElement;
    input.value = "06:45";
    input.dispatchEvent(new Event("change"));
    await Promise.resolve();
    expect(h.calls).toEqual([
      ["automation", "turn_off", { entity_id: "automation.wake" }],
      ["input_datetime", "set_datetime", { entity_id: "input_datetime.wake", time: "06:45:00" }],
    ]);
    card.remove();
  });
});
