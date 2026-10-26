import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MomentsHeader,
  conditionText,
  formatTime,
  formatWeather,
  greetingLine,
  subtitleParts,
} from "../src/cards/moments-header";
import { fakeHass } from "./fake-hass";

const at = (h: number, m = 0) => new Date(2026, 0, 1, h, m);

describe("formatTime", () => {
  it("respects 12 and 24 hour settings", () => {
    expect(formatTime(at(21, 5), { language: "en-US", time_format: "24" })).toBe("21:05");
    expect(formatTime(at(21, 5), { language: "en-GB", time_format: "12" })).toMatch(/^9:05\s?pm$/i);
  });
  it("follows the language by default", () => {
    expect(formatTime(at(21, 5), { language: "en-US", time_format: "language" })).toMatch(/^9:05\sPM$/);
    expect(formatTime(at(21, 5), { language: "de" })).toBe("21:05");
  });
  it("survives a bad language tag", () => {
    expect(formatTime(at(9, 0), { language: "not a locale!", time_format: "24" })).toBe("09:00");
  });
});

describe("formatWeather", () => {
  const hass = fakeHass({
    "sensor.inside": "21.4",
    "sensor.broken": "unavailable",
    "weather.home": ["partlycloudy", { temperature: 13.6 }],
    "weather.other": ["rainy", { temperature: 9 }],
  });
  it("combines inside and outside", () => {
    expect(formatWeather(hass, "weather.home", "sensor.inside")).toBe("21° inside · 14° out, partly cloudy");
  });
  it("defaults to the first weather entity", () => {
    expect(formatWeather(hass, undefined, undefined)).toBe("14° out, partly cloudy");
  });
  it("skips missing or unavailable parts", () => {
    expect(formatWeather(hass, "weather.missing", "sensor.broken")).toBe("");
    expect(formatWeather(fakeHass({ "weather.x": ["clear-night", {}] }))).toBe("clear");
    expect(formatWeather(fakeHass({ "weather.x": "unavailable", "sensor.t": "20" }), undefined, "sensor.t")).toBe(
      "20° inside",
    );
  });
  it("names conditions in words", () => {
    expect(conditionText("partlycloudy")).toBe("partly cloudy");
    expect(conditionText("lightning-rainy")).toBe("thunderstorms");
    expect(conditionText("some-new_state")).toBe("some new state");
  });
});

describe("greetingLine", () => {
  it("follows the clock and a time-of-day helper", () => {
    expect(greetingLine(undefined, { type: "x" }, at(8))).toBe("Good morning");
    expect(greetingLine(undefined, { type: "x" }, at(19))).toBe("Good evening");
    const hass = fakeHass({ "input_select.tod": "night" });
    expect(greetingLine(hass, { type: "x", time_of_day_entity: "input_select.tod" }, at(8))).toBe("Good night");
  });
});

describe("subtitleParts", () => {
  const hass = fakeHass(
    { "sensor.lux": "10", "weather.home": ["sunny", { temperature: 20 }] },
    { user: { id: "u1", name: "A" }, areas: { kitchen: { area_id: "kitchen", name: "Kitchen" } } },
  );
  it("adds the room from area or the current user, and dark outside", () => {
    expect(subtitleParts(hass, { type: "x", area: "kitchen", illuminance_entity: "sensor.lux" })).toEqual([
      "Kitchen",
      "20° out, sunny",
      "dark outside",
    ]);
    expect(subtitleParts(hass, { type: "x", rooms_by_user: { u1: "kitchen" } })).toEqual(["Kitchen", "20° out, sunny"]);
    expect(subtitleParts(hass, { type: "x", rooms_by_user: { u2: "kitchen" }, illuminance_entity: "sensor.lux", dark_below: 5 })).toEqual([
      "20° out, sunny",
    ]);
  });
});

describe("moments-header", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("validates config", () => {
    const el = document.createElement("moments-header") as MomentsHeader;
    expect(() => el.setConfig({ type: "x", weather_entity: "sensor.temp" })).toThrow(/weather/);
    expect(() => el.setConfig({ type: "x", dark_below: "dim" as any })).toThrow(/dark_below/);
    expect(() => el.setConfig({ type: "x", schedules_path: 5 as any })).toThrow(/schedules_path/);
    expect(() => el.setConfig({ type: "x", schedules_path: "schedules" })).not.toThrow();
    expect(() => el.setConfig({ type: "x", ...MomentsHeader.getStubConfig() })).not.toThrow();
  });

  it("refreshes every minute and clears its timers when removed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(10, 59));
    const el = document.createElement("moments-header") as MomentsHeader;
    el.setConfig({ type: "x" });
    el.hass = fakeHass({}, { locale: { language: "en-GB", time_format: "24" } });
    document.body.append(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("h1")!.textContent).toBe("Good morning");
    vi.advanceTimersByTime(60_000);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("h1")!.textContent).toBe("Good afternoon");
    expect(el.shadowRoot!.querySelector(".time")!.textContent).toBe("11:00");
    expect(vi.getTimerCount()).toBe(1);
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("navigates to schedules from the clock button", async () => {
    const el = document.createElement("moments-header") as MomentsHeader;
    el.setConfig({ type: "x", schedules_path: "/moments/schedules" });
    el.hass = fakeHass({});
    document.body.append(el);
    await el.updateComplete;
    const seen = vi.fn();
    window.addEventListener("location-changed", seen);
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>("button.schedules")!;
    expect(button.getAttribute("aria-label")).toBe("Schedules");
    button.click();
    expect(location.pathname).toBe("/moments/schedules");
    expect(seen).toHaveBeenCalledOnce();
    window.removeEventListener("location-changed", seen);
  });
});
